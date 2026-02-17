/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 *  ClientNetwork is the browser-side façade around a single WebSocket connection that talks to the
 *  Wolkenwelten game server. It handles three distinct concerns:
 *  1.  Maintaining the physical connection – automatic reconnect with exponential back-off, buffering of
 *      outgoing packets while offline, and thin wrappers around the browser WebSocket API.
 *  2.  (De)serialising packets – JSON for regular traffic via `WSQueue` and a very small binary protocol
 *      for latency-critical updates (currently only chunk updates).
 *  3.  Dispatching higher-level game messages to the rest of the client – e.g. world transforms, UI log
 *      entries, sound effects, etc.
 *
 *  Usage pattern:
 *  ```ts
 *  const net = new ClientNetwork(gameInstance); // automatically connects
 *  function gameLoop() {
 *      gameInstance.update();
 *      net.update();            // flush outbound packets once per frame
 *      requestAnimationFrame(gameLoop);
 *  }
 *  ```
 *
 *  Extending:
 *  ──────────
 *  Add new packet types by registering a handler **before** the network connects:
 *  ```ts
 *  ClientNetwork.addDefaultHandler("myPacket", async (game, args) => {
 *      // ... do something with args
 *  });
 *  ```
 *  On the server side, call `queue.call("myPacket", payload)` to broadcast to clients.
 *
 *  Foot-guns & gotchas:
 *  • `update()` **must** be called every tick – otherwise nothing is actually sent.
 *  • While the socket is down, outbound packets pile up in `rawQueue`; this array is unbounded so keep
 *    traffic low during connection loss.
 *  • Only JSON-serialisable values survive the trip through `WSQueue`. Passing functions, class instances
 *    or `BigInt` will explode in `postMessage`.
 *  • `broadcastEntities()` clears `Entity.pendingOwnershipChanges` every time it runs; touching that global
 *    elsewhere is a recipe for race conditions.
 *  • The binary protocol in `onArrayBuffer()` is intentionally minimal – make sure both ends agree on the
 *    exact layout before adding new message types.
 */
import { WSPacket, WSQueue, chunkPriorityScore } from "../network";
import { ClientEntry, PlayerStatus, PlayerUpdate } from "./clientEntry";
import type { ClientGame } from "./clientGame";
import { coordinateToWorldKey } from "../world/world";
import { NetworkObject } from "../world/entity/networkObject";
export type ClientHandler = (game: ClientGame, args: unknown) => Promise<void>;

type ChunkCoordinate = {
	x: number;
	y: number;
	z: number;
};

type PendingChunkInterest = ChunkCoordinate & {
	key: number;
	inFlight: boolean;
	retryCount: number;
	lastSentAt: number;
	nextRetryAt: number;
	priorityHint: number;
};

export class ClientNetwork {
	private ws?: WebSocket;
	private readonly queue: WSQueue;
	private readonly game: ClientGame;
	private readonly rawQueue: string[] = [];
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectTimeout?: NodeJS.Timeout;
	public playerStatus: PlayerStatus = "";
	private lastPlayerStatus: PlayerStatus = "";
	private lastTransfer = new Date();

	private pendingForceUpdates: NetworkObject[] = [];
	private readonly wantedChunks: Map<number, PendingChunkInterest> = new Map();
	private readonly pendingChunkCancels: Map<number, ChunkCoordinate> = new Map();
	private readonly maxChunkInterestPerTick = 24;
	private readonly requestTimeoutMs = 1200;
	private readonly requestBackoff = 1.6;
	private readonly maxRetriesBeforeBackoff = 6;
	private readonly maxRequestTimeoutMs = 6000;

	private chunkRequestsSent = 0;
	private chunkRequestsRetried = 0;
	private chunkCancelsSent = 0;
	private chunkResponsesReceived = 0;
	private lastChunkDebugLogMs = 0;

	private static readonly defaultHandlers: Map<string, ClientHandler> =
		new Map();

	static addDefaultHandler(T: string, handler: ClientHandler) {
		this.defaultHandlers.set(T, handler);
	}

	forceUpdateNetworkObject(obj: NetworkObject) {
		this.pendingForceUpdates.push(obj);
	}

	private normalizeChunkCoordinate(x: number, y: number, z: number): ChunkCoordinate {
		return {
			x: x & ~0x1f,
			y: y & ~0x1f,
			z: z & ~0x1f,
		};
	}

	private markChunkLoaded(x: number, y: number, z: number) {
		const c = this.normalizeChunkCoordinate(x, y, z);
		const key = coordinateToWorldKey(c.x, c.y, c.z);
		this.wantedChunks.delete(key);
		this.pendingChunkCancels.delete(key);
		this.chunkResponsesReceived++;
	}

	private resetChunkInflightState() {
		for (const wanted of this.wantedChunks.values()) {
			wanted.inFlight = false;
			wanted.lastSentAt = 0;
			wanted.nextRetryAt = 0;
		}
	}

	private getPriorityHint(c: ChunkCoordinate): number {
		const player = this.game.player;
		if (!player) {
			return 0;
		}
		return chunkPriorityScore({
			chunkX: c.x,
			chunkY: c.y,
			chunkZ: c.z,
			playerX: player.x,
			playerY: player.y,
			playerZ: player.z,
			yaw: player.yaw,
			pitch: player.pitch,
		});
	}

	markChunkNeeded(x: number, y: number, z: number) {
		const c = this.normalizeChunkCoordinate(x, y, z);
		const key = coordinateToWorldKey(c.x, c.y, c.z);
		const existing = this.wantedChunks.get(key);

		if (existing) {
			existing.x = c.x;
			existing.y = c.y;
			existing.z = c.z;
			existing.priorityHint = this.getPriorityHint(c);
			this.pendingChunkCancels.delete(key);
			return;
		}

		this.wantedChunks.set(key, {
			key,
			x: c.x,
			y: c.y,
			z: c.z,
			inFlight: false,
			retryCount: 0,
			lastSentAt: 0,
			nextRetryAt: 0,
			priorityHint: this.getPriorityHint(c),
		});
		this.pendingChunkCancels.delete(key);
	}

	markChunkDropped(x: number, y: number, z: number) {
		const c = this.normalizeChunkCoordinate(x, y, z);
		const key = coordinateToWorldKey(c.x, c.y, c.z);
		this.wantedChunks.delete(key);
		this.pendingChunkCancels.set(key, c);
	}

	private queueChunkCancels() {
		if (this.pendingChunkCancels.size === 0) {
			return;
		}
		const batch: ChunkCoordinate[] = [];
		for (const [key, c] of this.pendingChunkCancels.entries()) {
			batch.push(c);
			this.pendingChunkCancels.delete(key);
			if (batch.length >= this.maxChunkInterestPerTick) {
				break;
			}
		}
		if (batch.length > 0) {
			this.chunkCancelsSent += batch.length;
			this.queue.call("chunkCancelBatch", batch);
		}
	}

	private queueChunkInterests() {
		if (this.wantedChunks.size === 0) {
			return;
		}
		const now = Date.now();
		const pending: PendingChunkInterest[] = [];
		for (const [key, wanted] of this.wantedChunks.entries()) {
			const chunk = this.game.world.getChunk(wanted.x, wanted.y, wanted.z);
			if (chunk?.loaded) {
				this.wantedChunks.delete(key);
				continue;
			}

			if (wanted.inFlight) {
				if (now < wanted.nextRetryAt) {
					continue;
				}
				wanted.inFlight = false;
				wanted.retryCount++;
				this.chunkRequestsRetried++;
			}

			wanted.priorityHint = this.getPriorityHint(wanted);
			pending.push(wanted);
		}

		if (pending.length === 0) {
			return;
		}

		pending.sort((a, b) => b.priorityHint - a.priorityHint);
		const batch = pending
			.slice(0, this.maxChunkInterestPerTick)
			.map((wanted) => {
				wanted.inFlight = true;
				wanted.lastSentAt = now;
				const timeout =
					this.requestTimeoutMs *
					Math.pow(
						this.requestBackoff,
						Math.min(wanted.retryCount, this.maxRetriesBeforeBackoff),
					);
				wanted.nextRetryAt = now + Math.min(this.maxRequestTimeoutMs, timeout);
				return {
					x: wanted.x,
					y: wanted.y,
					z: wanted.z,
					priorityHint: wanted.priorityHint,
				};
			});

		if (batch.length > 0) {
			this.chunkRequestsSent += batch.length;
			this.queue.call("chunkInterestBatch", batch);
		}
	}

	private logChunkSchedulerStats() {
		if (!this.game.options.debug) {
			return;
		}
		const now = Date.now();
		if (now - this.lastChunkDebugLogMs < 5000) {
			return;
		}
		this.lastChunkDebugLogMs = now;

		let inFlight = 0;
		for (const wanted of this.wantedChunks.values()) {
			if (wanted.inFlight) {
				inFlight++;
			}
		}

		console.log(
			`[chunk-client] wanted=${this.wantedChunks.size} inflight=${inFlight} sent=${this.chunkRequestsSent} retried=${this.chunkRequestsRetried} cancels=${this.chunkCancelsSent} received=${this.chunkResponsesReceived}`,
		);

		this.chunkRequestsSent = 0;
		this.chunkRequestsRetried = 0;
		this.chunkCancelsSent = 0;
		this.chunkResponsesReceived = 0;
	}

	/**
	 * Collects every entity currently owned by the local player and sends their serialised form to the
	 * server. This is invoked from `flushRawQueue()` each tick so the authoritative state remains in sync
	 * without callers having to remember explicit updates.
	 *
	 * WARNING: This method also empties `Entity.pendingOwnershipChanges`, potentially dropping ownership
	 * changes queued elsewhere if you call it manually.
	 */
	private broadcastNetworkObjects() {
		const objs = [];
		for (const obj of this.game.world.networkObjects.values()) {
			if (obj.ownerID !== this.game.networkID) {
				continue;
			}
			objs.push(obj.serialize());
		}
		// Also send any entities with pending ownership changes, even if it means duplicates!
		for (const obj of this.pendingForceUpdates) {
			objs.push(obj.serialize());
		}
		this.pendingForceUpdates.length = 0;
		this.queue.call("updateNetworkObjects", objs);
	}

	/**
	 * Fast-path for binary messages coming from the server. Currently only message-type `1` (chunk update)
	 * is implemented. The binary layout is:
	 *  byte 0   – uint8   message type (1 = chunk update)
	 *  bytes 4-7 – int32   chunk X coordinate
	 *  bytes 8-11– int32   chunk Y coordinate
	 *  bytes 12-15–int32   chunk Z coordinate
	 *  bytes 16-19–uint32  chunk version
	 *  bytes 20… – uint8[] raw block data
	 */
	private onArrayBuffer(data: ArrayBuffer) {
		const view = new DataView(data);
		const messageType = view.getUint8(0);

		// Message type 1 = chunk update
		if (messageType === 1) {
			const x = view.getInt32(4, true);
			const y = view.getInt32(8, true);
			const z = view.getInt32(12, true);
			const version = view.getUint32(16, true);

			// Get the chunk data
			const blocks = new Uint8Array(data.slice(20));

			// Update the chunk
			const chunk = this.game.world.getOrGenChunk(x, y, z);
			chunk.blocks.set(blocks, 0);
			chunk.lastUpdated = version;
			chunk.loaded = true;
			chunk.invalidate();
			this.markChunkLoaded(x, y, z);

			return;
		}
		// Add more binary message types here if needed
	}

	private onMessage(ev: MessageEvent) {
		// Check if it's binary data
		if (ev.data instanceof ArrayBuffer) {
			this.onArrayBuffer(ev.data);
		} else if (ev.data instanceof Blob) {
			// Handle Blob data by converting to ArrayBuffer first
			ev.data.arrayBuffer().then((data) => this.onArrayBuffer(data));
		} else {
			// Handle JSON messages as before
			const raw = ev.data || "";
			try {
				const msg = JSON.parse(raw);
				if (typeof msg.T !== "string") {
					console.error(msg);
					throw new Error("Invalid message received");
				}

				if (msg.T === "packet") {
					this.queue.handlePacket(msg as WSPacket);
				}
			} catch (e) {
				// If it's not valid JSON and not a binary message we understand, log an error
				console.error("Invalid message format", e);
			}
		}
	}

	/**
	 * Flushes the internal message buffer when the socket is open. Besides sending the raw strings queued
	 * in `rawQueue` it also piggybacks mandatory sync packets like entity state and the player's status.
	 * Should **only** be called when `ws.readyState === WebSocket.OPEN`.
	 */
	private flushRawQueue() {
		if (!this.ws) {
			throw new Error("WebSocket not connected");
		}

		this.broadcastNetworkObjects();
		if (this.playerStatus !== this.lastPlayerStatus) {
			this.queue.call("setPlayerStatus", this.playerStatus);
			this.lastPlayerStatus = this.playerStatus;
		}
		for (const raw of this.rawQueue) {
			this.ws.send(raw);
		}
		this.rawQueue.length = 0;
	}

	private onConnect() {
		console.log("(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ Connected to server!");
		this.resetChunkInflightState();
		setTimeout(async () => {
			const playerID = await this.getPlayerID();
			this.game.setPlayerID(playerID);
		}, 0);
		this.reconnectAttempts = 0;
		this.flushRawQueue();
	}

	private close(_event?: CloseEvent | Event) {
		console.log("(｡•́︿•̀｡) Connection closed, attempting reconnect...");
		this.resetChunkInflightState();
		if (this.ws) {
			this.ws.close();
		}
		this.ws = undefined;

		// Clear any existing reconnect timeout
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}

		// Try to reconnect with exponential backoff
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
			console.log(
				`(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ Attempting reconnect in ${delay / 1000} seconds...`,
			);

			this.reconnectTimeout = setTimeout(() => {
				console.log("(◕‿◕✿) Attempting to reconnect...");
				this.reconnectAttempts++;
				this.connect();
			}, delay);
		} else {
			console.log("(╥﹏╥) Max reconnection attempts reached");
			this.game.ui.log.addEntry("Lost connection to server (╥﹏╥)");
		}
	}

	private connect() {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const url = `${protocol}//${window.location.host}/api/ws`;
		console.log("Connecting to", url);
		this.ws = new WebSocket(url);
		this.ws.onmessage = this.onMessage.bind(this);
		this.ws.onopen = this.onConnect.bind(this);
		this.ws.onclose = this.close.bind(this);
		this.ws.onerror = this.close.bind(this);
	}

	/**
	 * Low-level helper used by the public API to ship a raw JSON string over the wire. If the connection is
	 * not yet open the payload is buffered until the next successful `onopen` event.
	 */
	private sendRaw(raw: string) {
		if (!this.ws) {
			this.rawQueue.push(raw);
			this.connect();
			return;
		}
		if (this.ws.readyState !== this.ws.OPEN) {
			this.rawQueue.push(raw);
			return;
		}
		this.flushRawQueue();
		this.ws.send(raw);
	}

	/**
	 * One tick of network I/O: serialise everything in `WSQueue` into a single JSON string and hand it over
	 * to `sendRaw()`. This is decoupled so the caller can inspect/modify the queue right before sending.
	 */
	private transfer() {
		if (!this.ws || this.ws.readyState !== this.ws.OPEN) {
			return;
		}
		const now = new Date();
		const timeDiff = now.getTime() - this.lastTransfer.getTime();
		if (timeDiff < 1000 / 30) {
			return;
		}
		this.lastTransfer = now;

		this.queueChunkCancels();
		this.queueChunkInterests();
		this.logChunkSchedulerStats();

		this.sendRaw(this.queue.flush());
	}

	/**
	 * Public entry-point – call this once per game tick to allow ClientNetwork to push its outbound traffic.
	 */
	update() {
		this.transfer();
	}

	/**
	 * Creates a new ClientNetwork bound to the provided `ClientGame` instance and immediately attempts to
	 * establish a WebSocket connection. The constructor is deliberately lightweight so that failure to
	 * connect does not break game start-up; reconnect logic will take over.
	 */
	constructor(client: ClientGame) {
		this.game = client;
		this.queue = new WSQueue();
		this.addDefaultHandlers();
		this.connect();
	}

	/**
	 * Register the built-in packet handlers that the vanilla server relies on. If you need to override any
	 * of them, register your own handler **before** instantiating ClientNetwork so it takes precedence.
	 */
	private addDefaultHandlers() {
		this.queue.registerCallHandler("addLogEntry", async (args: unknown) => {
			if (typeof args !== "string") {
				throw new Error("Invalid log entry received");
			}
			const msg = args as string;
			this.game.ui.log.addEntry(msg);
		});

		this.queue.registerCallHandler(
			"updateNetworkObjects",
			async (args: unknown) => {
				if (!Array.isArray(args)) {
					throw new Error("Invalid network objects received");
				}
				const objs = args as any[];
				for (const obj of objs) {
					this.game.world.deserializeNetworkObject(obj);
				}
			},
		);

		this.queue.registerCallHandler("emptyChunk", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid empty chunk received");
			}
			const msg = args as any;
			const chunk = this.game.world.getOrGenChunk(msg.x, msg.y, msg.z);
			chunk.lastEmptyCheck = msg.version;
			chunk.lastEmptyCheckResult = true;
			chunk.blocks.fill(0);
			chunk.lastUpdated = msg.version;
			chunk.loaded = true;
			chunk.invalidate();
			this.markChunkLoaded(msg.x, msg.y, msg.z);
		});

		this.queue.registerCallHandler("explode", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid explode received");
			}
			const msg = args as any;
			const x = msg.x;
			const y = msg.y;
			const z = msg.z;
			const r = msg.radius;
			const attackerID = msg.attackerID;
			this.game.render?.particle.fxExplosion(x, y, z, r);
			this.game.audio?.playAtPosition("bomb", 2, [x, y, z]);
			const player = this.game.player;
			if (!player) {
				return;
			}
			const dx = player.x - x;
			const dy = player.y - y;
			const dz = player.z - z;
			const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
			const repulsionBeforeHit = player.repulsionMultiplier;

			// Only apply explosion effects to entities that are actually inside the blast.
			if (dist < r) {
				const baseDamage =
					typeof msg.damage === "number" && Number.isFinite(msg.damage)
						? msg.damage
						: 10;
				const dmg = Math.max(0, Math.min(10, baseDamage / Math.max(1, dist)));
				player.damage(dmg);
				player.lastAttackerId = attackerID;
				player.lastAttackerCooldown = 100;
			}

			// Keep blast repulsion inside explosion radius and use a softer falloff.
			if (dist > 0 && dist < r) {
				const normalized = (r - dist) / r;
				const forceFactor = normalized * normalized;
				const repulsionScale = Math.min(1.75, repulsionBeforeHit);
				let force = Math.min(2.35, 1.85 * forceFactor * repulsionScale);

				if (player.isBlocking()) {
					force *= 0.15;
				}

				player.vx += (dx / dist) * force;
				player.vy += (dy / dist) * force * 0.5;
				player.vz += (dz / dist) * force;
			}
		});

		this.queue.registerCallHandler("playerHit", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid player hit received");
			}
			const msg = args as any;

			// Handle the attacker animation
			const attackerId = msg.attackerId || msg.playerID; // For backward compatibility
			const attacker = this.game.clients.get(attackerId);

			// The rest of the existing code for handling damage to the local player
			const game = this.game;
			game.render?.particle.fxStrike(msg.px, msg.py, msg.pz, msg.heavy);

			if (!game.player) {
				return;
			}

			// Check if we (the local player) are in range and should take damage
			const dx = game.player.x - msg.px;
			const dy = game.player.y - msg.py;
			const dz = game.player.z - msg.pz;
			const dd = dx * dx + dy * dy + dz * dz;

			if (dd <= msg.radius * msg.radius) {
				let dmg = msg.damage;
				if (game.player.isBlocking()) {
					dmg *= 0.6;
				}

				if (game.player.blockCharge > 0 && game.player.blockCharge < 16) {
					// Super block
					game.player.blockCharge = 0;
					game.player.strike();
					return;
				}

				// Calculate knockback direction and magnitude
				const odx = game.player.x - msg.ox;
				const ody = game.player.y - msg.oy;
				const odz = game.player.z - msg.oz;
				const odist = odx * odx + ody * ody + odz * odz;
				const dist = Math.cbrt(odist);
				game.player.damage(dmg);
				if (attacker) {
					console.log("attacker", attacker);
					//game.player.onAttack(attacker.char);
				}

				game.player.playSound("slap", msg.heavy ? 1 : 0.3);

				if (dist > 0) {
					// Normalize direction vector
					let ndx = odx / dist;
					let ndz = odz / dist;

					// Base knockback + additional based on damage
					let knockbackForce =
						0.1 +
						Math.max(1, msg.damage - 3) *
							0.05 *
							game.player.repulsionMultiplier *
							game.player.repulsionMultiplier;

					if (game.player.isBlocking()) {
						knockbackForce *= 0.1;
					}

					if (msg.networkID !== 0) {
						game.player.lastAttackerId = msg.networkID;
						game.player.lastAttackerCooldown = 100;
					}

					// Apply horizontal knockback
					game.player.vx += ndx * Math.min(12, knockbackForce);
					game.player.vz += ndz * Math.min(12, knockbackForce);
					// Add some vertical knockback for a more dramatic effect
					game.player.vy += Math.min(1, knockbackForce * 0.2);

					game.player.knockoutTimer += game.player.repulsionMultiplier * 25;
				}
			}
		});

		this.queue.registerCallHandler("playerList", async (args: unknown) => {
			if (!Array.isArray(args)) {
				throw new Error("Invalid player list received");
			}

			const playerList = args as PlayerUpdate[];
			for (const player of playerList) {
				if (!player.name) {
					continue;
				}
				let client = this.game.clients.get(player.id);
				if (!client) {
					client = new ClientEntry(this.game, player.id);
					this.game.clients.set(player.id, client);
				}
				client.update(player);
			}
			const validPlayerIds = new Set(playerList.map((player) => player.id));

			// Check for players that need to be removed
			for (const [id, client] of this.game.clients.entries()) {
				if (!validPlayerIds.has(id)) {
					// This player is no longer in the server's list, remove them
					this.game.clients.delete(id);
					this.game.ui.log.addEntry(`${client.name} left the game`);
					for (const entity of this.game.world.entities.values()) {
						if (entity.ownerID === id) {
							entity.destroy();
						}
					}
				}
			}
		});

		this.queue.registerCallHandler("playerJump", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid player jump received");
			}
			const msg = args as any;

			if (!this.game.player) {
				return;
			}

			// Don't show particles for our own jumps
			if (msg.playerId === this.game.player.id) {
				return;
			}

			// Show jump particles at the specified location
			this.game.render?.particle.fxJump(msg.x, msg.y, msg.z);
		});

		this.queue.registerCallHandler("playSound", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid player hit received");
			}
			const hit = args as any;
			if (!hit.sound) {
				throw new Error("Invalid sound received");
			}
			if (hit.entityId) {
				const entity = this.game.world.entities.get(hit.entityId);
				if (entity) {
					entity.playSound(hit.sound, hit.volume || 1, false, false);
					return;
				}
			}
			if (hit.x || hit.y || hit.z) {
				const x = hit.x || 0;
				const y = hit.y || 0;
				const z = hit.z || 0;
				this.game.audio?.playAtPosition(hit.sound, hit.volume || 1, [x, y, z]);
			}
		});
	}

	async getPlayerID(): Promise<number> {
		const val = await this.queue.call("getPlayerID");
		if (typeof val !== "number") {
			throw new Error("Invalid player ID received");
		}
		return val;
	}

	async addLogEntry(msg: string): Promise<void> {
		await this.queue.call("addLogEntry", msg);
	}

	async setPlayerName(name: string): Promise<void> {
		await this.queue.call("setPlayerName", name);
	}

	async chunkRequest(x: number, y: number, z: number): Promise<void> {
		this.markChunkNeeded(x, y, z);
	}

	async chunkDrop(x: number, y: number, z: number): Promise<void> {
		this.markChunkDropped(x, y, z);
	}

	async blockUpdate(x: number, y: number, z: number, block: number) {
		await this.queue.call("blockUpdate", {
			x,
			y,
			z,
			block,
		});
	}

	async playerHit(
		playerID: number,
		radius: number,
		damage: number,
		px: number,
		py: number,
		pz: number,
		ox: number,
		oy: number,
		oz: number,
		networkID: number,
		heavy: boolean,
	) {
		// Send to server
		await this.queue.call("playerHit", {
			playerID,
			radius,
			damage,
			px,
			py,
			pz,
			ox,
			oy,
			oz,
			networkID,
			heavy,
		});
	}

	async playerDeath(attackerId: number): Promise<void> {
		await this.queue.call("playerDeath", attackerId);
	}

	async playerJump(x: number, y: number, z: number): Promise<void> {
		if (!this.game.player) {
			return;
		}

		await this.queue.call("playerJump", {
			playerId: this.game.player.id,
			x,
			y,
			z,
		});
	}

	async playSound(args: {
		sound: string;
		volume: number;
		entityId?: number;
		x?: number;
		y?: number;
		z?: number;
	}) {
		await this.queue.call("playSound", args);
	}
}
