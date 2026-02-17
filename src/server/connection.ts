/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * ClientConnection – encapsulates the state and networking logic for a single
 * player connected via WebSocket. It is responsible for queuing outbound
 * packets, synchronising chunk data, forwarding RPCs to other players and
 * cleaning up owned entities on disconnect.
 *
 * Life-cycle:
 *   1. Instantiated by `ServerGame.onConnect` when a new WebSocket arrives.
 *   2. Sets up default RPC handlers and attaches `message`, `close` and
 *      `error` listeners to the socket.
 *   3. `ServerGame` calls `transferQueue()` every tick (10 ms) to flush queued
 *      packets; if the connection stays silent for several seconds it may be
 *      closed for idleness.
 *
 * Extension points:
 *   • Override `registerDefaultHandlers()` to add or change RPC behaviour.
 *   • Override `broadcastEntities()` to change serialisation or include extra
 *     per-tick data.
 *
 * Footguns & Caveats:
 *   • Keep the work done inside the WS `message` handler lightweight – heavy
 *     processing blocks the Node.js event loop.
 *   • The binary chunk protocol assumes chunks are exactly 32×32×32 blocks;
 *     changing this requires revisiting `clientUpdateChunk()`.
 *   • Remember to reset `updatesWithoutPackets` when introducing new inbound
 *     packet types, otherwise clients might be kicked prematurely.
 */
import { WebSocket } from "ws";
import type { ServerGame } from "./serverGame";
import { WSPacket, WSQueue, chunkPriorityScore } from "../network";
import { coordinateToWorldKey } from "../world/world";
import { Chunk } from "../world/chunk/chunk";
import type { PlayerStatus } from "../client/clientEntry";
import { Character } from "../world/entity/character";
import { NetworkObject } from "../world/entity/networkObject";

type ChunkCoordinate = {
	x: number;
	y: number;
	z: number;
};

type ChunkInterestRequest = ChunkCoordinate & {
	priorityHint?: number;
};

type WantedChunk = ChunkCoordinate & {
	key: number;
	knownVersion: number;
	lastSentAt: number;
	priorityHint: number;
};

let idCounter = 0;
export class ClientConnection {
	private socket: WebSocket;

	id: number;
	playerName = "";
	playerStatus: PlayerStatus = "";
	deaths = 0;
	kills = 0;
	server: ServerGame;

	x = 0;
	y = 0;
	z = 0;

	yaw = 0;
	pitch = 0;

	health = 10;
	maxHealth = 10;
	updates = 0;

	animation = 0;
	animationId = 0;

	updatesWithoutPackets = 0;

	bytesSent = 0;
	msgsSent = 0;
	bytesReceived = 0;
	msgsReceived = 0;
	debugInterval: NodeJS.Timeout | null = null;

	wantedChunks: Map<number, WantedChunk> = new Map();
	private chunkBuffer = new ArrayBuffer(20 + 32 * 32 * 32);
	private readonly maxChunkSendsPerTick = 10;
	private readonly maxChunkBytesPerTick = 450 * 1024;

	private chunkRequestsQueued = 0;
	private chunkRequestsCanceled = 0;
	private chunkRetrySends = 0;
	private chunkUpdatesSent = 0;
	private chunkBytesSent = 0;

	q: WSQueue = new WSQueue();
	syncQueued = false;

	private pendingForceUpdates: NetworkObject[] = [];

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

	private upsertChunkInterest(request: ChunkInterestRequest) {
		const c = this.normalizeChunkCoordinate(request.x, request.y, request.z);
		const key = coordinateToWorldKey(c.x, c.y, c.z);
		const old = this.wantedChunks.get(key);
		if (!old) {
			this.wantedChunks.set(key, {
				key,
				x: c.x,
				y: c.y,
				z: c.z,
				knownVersion: -1,
				lastSentAt: 0,
				priorityHint: request.priorityHint || 0,
			});
		} else {
			old.x = c.x;
			old.y = c.y;
			old.z = c.z;
			old.priorityHint = request.priorityHint || old.priorityHint;
		}
		this.chunkRequestsQueued++;
	}

	private cancelChunkInterest(request: ChunkCoordinate) {
		const c = this.normalizeChunkCoordinate(request.x, request.y, request.z);
		const key = coordinateToWorldKey(c.x, c.y, c.z);
		if (this.wantedChunks.delete(key)) {
			this.chunkRequestsCanceled++;
		}
	}

	private chunkPriority(entry: WantedChunk): number {
		const score = chunkPriorityScore({
			chunkX: entry.x,
			chunkY: entry.y,
			chunkZ: entry.z,
			playerX: this.x,
			playerY: this.y,
			playerZ: this.z,
			yaw: this.yaw,
			pitch: this.pitch,
		});
		return score + entry.priorityHint * 0.01;
	}

	public close() {
		for (const entity of this.server.world.entities.values()) {
			if (entity.ownerID === this.id) {
				entity.destroy();
			}
		}
		this.server.sockets.delete(this.id);
		if (this.debugInterval) {
			clearInterval(this.debugInterval);
		}
		// Notify server that a player disconnected
		this.server.onPlayerDisconnect();
	}

	/**
	 * Wraps a freshly accepted WebSocket inside a connection object, assigns a
	 * unique player id and wires up all event listeners.
	 *
	 * Avoid long-running synchronous work here—the server tick is already
	 * running and delays will cause missed frames.
	 *
	 * @param server Reference to the authoritative ServerGame instance
	 * @param socket Raw WebSocket negotiated by the HTTP server
	 */
	constructor(server: ServerGame, socket: WebSocket) {
		this.id = ++idCounter;
		this.socket = socket;
		this.server = server;

		socket.on("error", (error) => {
			console.error(`(╥﹏╥) WebSocket error:`, error);
			this.close();
		});

		socket.on("close", () => {
			console.log(`Closing connection`);
			this.close();
		});

		socket.on("message", (msg) => {
			try {
				this.updatesWithoutPackets = 0;
				const s = msg.toString();
				this.bytesReceived += s.length;
				this.msgsReceived++;
				const raw = JSON.parse(s);
				if (raw.T === "packet") {
					const packet = raw as WSPacket;
					this.q.handlePacket(packet);
				}
				// Only do this after handling all packets, because we might have multiple update packets in one frame
				if (this.syncQueued) {
					this.broadcastNetworkObjects();
					this.syncQueued = false;
				}
			} catch (e) {
				console.error(e);
			}
		});

		this.debugInterval = setInterval(() => {
			const kbpsIn = this.bytesReceived / 1024;
			const kbpsOut = this.bytesSent / 1024;
			if (this.server.options.debug) {
				console.log(
					`Bytes sent: ${kbpsOut}kbps (${this.msgsSent} msgs), bytes received: ${kbpsIn}kbps (${this.msgsReceived} msgs), chunkWanted=${this.wantedChunks.size}, chunkQueued=${this.chunkRequestsQueued}, chunkCanceled=${this.chunkRequestsCanceled}, chunkSent=${this.chunkUpdatesSent}, chunkRetried=${this.chunkRetrySends}, chunkBytes=${this.chunkBytesSent}`,
				);
			}
			this.bytesSent = 0;
			this.bytesReceived = 0;
			this.msgsSent = 0;
			this.msgsReceived = 0;
			this.chunkRequestsQueued = 0;
			this.chunkRequestsCanceled = 0;
			this.chunkRetrySends = 0;
			this.chunkUpdatesSent = 0;
			this.chunkBytesSent = 0;
		}, 1000);

		this.registerDefaultHandlers();
	}

	private broadcastNetworkObjects() {
		const objs = [];
		for (const obj of this.server.world.networkObjects.values()) {
			if (obj.ownerID === this.id) {
				continue;
			}
			objs.push(obj.serialize());
		}
		// Also send any entities with pending ownership changes, even if it means duplicates!
		for (const obj of this.pendingForceUpdates) {
			objs.push(obj.serialize());
		}
		this.pendingForceUpdates.length = 0;
		this.q.call("updateNetworkObjects", objs);
	}

	registerDefaultHandlers() {
		this.q.registerCallHandler("getPlayerID", async (args: unknown) => {
			console.log("getPlayerID", args, this.id);
			return this.id;
		});

		this.q.registerCallHandler(
			"updateNetworkObjects",
			async (args: unknown) => {
				if (!Array.isArray(args)) {
					throw new Error("Invalid network objects received");
				}
				const objs = args as any[];
				for (const data of objs) {
					const obj = this.server.world.deserializeNetworkObject(data);
					if (obj && obj.ownerID === this.id && obj.T === "Character") {
						const char = obj as Character;
						this.x = char.x;
						this.y = char.y;
						this.z = char.z;
						this.yaw = char.yaw;
						this.pitch = char.pitch;
					}
				}
				this.syncQueued = true;
			},
		);

		this.q.registerCallHandler("setPlayerStatus", async (args: unknown) => {
			if (typeof args !== "string") {
				throw new Error("Invalid player status received");
			}
			this.playerStatus = args as PlayerStatus;
			for (const client of this.server.sockets.values()) {
				client.broadcastPlayerList();
			}
		});

		this.q.registerCallHandler("setPlayerName", async (args: unknown) => {
			if (typeof args !== "string") {
				throw new Error("Invalid player name received");
			}
			this.playerName = args as string;
			const msg = this.playerName + " joined the game";
			console.log(msg);
			for (const client of this.server.sockets.values()) {
				client.q.call("addLogEntry", msg);
				client.broadcastPlayerList();
			}
			return "";
		});

		this.q.registerCallHandler("addLogEntry", async (args: unknown) => {
			const msg = this.playerName + ": " + args;
			console.log(msg);
			for (const client of this.server.sockets.values()) {
				client.q.call("addLogEntry", msg);
			}
			return "";
		});

		this.q.registerCallHandler("chunkCancelBatch", async (args: unknown) => {
			if (!Array.isArray(args)) {
				throw new Error("Invalid chunk cancel batch received");
			}
			for (const entry of args) {
				if (
					typeof entry !== "object" ||
					!entry ||
					typeof (entry as ChunkCoordinate).x !== "number" ||
					typeof (entry as ChunkCoordinate).y !== "number" ||
					typeof (entry as ChunkCoordinate).z !== "number"
				) {
					continue;
				}
				this.cancelChunkInterest(entry as ChunkCoordinate);
			}
			return "";
		});

		this.q.registerCallHandler("chunkInterestBatch", async (args: unknown) => {
			if (!Array.isArray(args)) {
				throw new Error("Invalid chunk interest batch received");
			}
			for (const entry of args) {
				if (
					typeof entry !== "object" ||
					!entry ||
					typeof (entry as ChunkInterestRequest).x !== "number" ||
					typeof (entry as ChunkInterestRequest).y !== "number" ||
					typeof (entry as ChunkInterestRequest).z !== "number"
				) {
					continue;
				}
				this.upsertChunkInterest(entry as ChunkInterestRequest);
			}
			return "";
		});

		// Backward compatibility for legacy clients.
		this.q.registerCallHandler("chunkDrop", async (args: unknown) => {
			if (
				typeof args !== "object" ||
				!args ||
				typeof (args as ChunkCoordinate).x !== "number" ||
				typeof (args as ChunkCoordinate).y !== "number" ||
				typeof (args as ChunkCoordinate).z !== "number"
			) {
				throw new Error("Invalid chunk drop received");
			}
			this.cancelChunkInterest(args as ChunkCoordinate);
			return "";
		});

		// Backward compatibility for legacy clients.
		this.q.registerCallHandler("chunkRequest", async (args: unknown) => {
			if (
				typeof args !== "object" ||
				!args ||
				typeof (args as ChunkInterestRequest).x !== "number" ||
				typeof (args as ChunkInterestRequest).y !== "number" ||
				typeof (args as ChunkInterestRequest).z !== "number"
			) {
				throw new Error("Invalid chunk request received");
			}
			this.upsertChunkInterest(args as ChunkInterestRequest);
			return "";
		});

		this.q.registerCallHandler("blockUpdate", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid block update received");
			}
			const update = args as any;
			this.server.world.setBlock(update.x, update.y, update.z, update.block);
		});

		this.q.registerCallHandler("playerHit", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid player hit received");
			}
			const hit = args as any;
			for (const client of this.server.sockets.values()) {
				if (client === this) {
					continue;
				}
				client.q.call("playerHit", hit);
			}
		});

		this.q.registerCallHandler("playSound", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid player hit received");
			}
			const hit = args as any;
			for (const client of this.server.sockets.values()) {
				if (client === this) {
					continue;
				}
				client.q.call("playSound", hit);
			}
		});

		this.q.registerCallHandler("playerDeath", async (args: unknown) => {
			this.deaths++;
			if (typeof args !== "number") {
				throw new Error("Invalid player death received");
			}
			const attackerId = args as number;
			if (attackerId !== 0) {
				for (const client of this.server.sockets.values()) {
					if (client.id === attackerId && client.id !== this.id) {
						client.kills++;
					}
				}
			}
			for (const client of this.server.sockets.values()) {
				client.broadcastPlayerList();
			}
		});

		this.q.registerCallHandler("playerJump", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid player jump received");
			}
			const jump = args as any;

			// Broadcast to all other clients
			for (const client of this.server.sockets.values()) {
				if (client === this) {
					continue;
				}
				client.q.call("playerJump", jump);
			}
		});
	}

	clientUpdateChunk(chunk: Chunk) {
		if (chunk.isEmpty()) {
			this.q.call("emptyChunk", {
				x: chunk.x,
				y: chunk.y,
				z: chunk.z,
				version: chunk.lastUpdated,
			});
			return;
		}

		// Create binary message for chunk update
		// Format: [messageType(1), padding(3), x(4), y(4), z(4), version(4), data(32*32*32)]
		const view = new DataView(this.chunkBuffer);

		// Message type 1 = chunk update
		view.setUint8(0, 1);

		// Chunk coordinates and version
		view.setInt32(4, chunk.x, true);
		view.setInt32(8, chunk.y, true);
		view.setInt32(12, chunk.z, true);
		view.setUint32(16, chunk.lastUpdated, true);

		// Copy chunk data
		const uint8View = new Uint8Array(this.chunkBuffer, 20);
		uint8View.set(chunk.blocks);

		// Send binary data directly
		this.socket.send(this.chunkBuffer);

		this.bytesSent += this.chunkBuffer.byteLength;
		this.msgsSent++;
	}

	flushPrioritizedChunkSends() {
		if (this.wantedChunks.size === 0) {
			return;
		}

		const pending: WantedChunk[] = [];
		for (const [key, entry] of this.wantedChunks.entries()) {
			const chunk = this.server.world.getChunk(entry.x, entry.y, entry.z);
			if (chunk && entry.knownVersion >= chunk.lastUpdated) {
				continue;
			}

			pending.push(entry);
			// Clean up dead references that accidentally got aliased by key reuse.
			if (entry.key !== key) {
				this.wantedChunks.delete(key);
				this.wantedChunks.set(entry.key, entry);
			}
		}

		if (pending.length === 0) {
			return;
		}

		pending.sort((a, b) => this.chunkPriority(b) - this.chunkPriority(a));

		let sent = 0;
		let bytesSent = 0;
		const now = Date.now();
		for (const entry of pending) {
			if (sent >= this.maxChunkSendsPerTick) {
				break;
			}
			if (bytesSent >= this.maxChunkBytesPerTick) {
				break;
			}

			const chunk = this.server.world.getOrGenChunk(entry.x, entry.y, entry.z);
			if (entry.knownVersion >= chunk.lastUpdated) {
				continue;
			}
			if (entry.knownVersion >= 0) {
				this.chunkRetrySends++;
			}

			const bytes =
				chunk.isEmpty() ? 96 : this.chunkBuffer.byteLength; // rough JSON+binary estimate for budgeting
			if (bytesSent + bytes > this.maxChunkBytesPerTick && sent > 0) {
				break;
			}

			this.clientUpdateChunk(chunk);
			entry.knownVersion = chunk.lastUpdated;
			entry.lastSentAt = now;
			sent++;
			bytesSent += bytes;
		}

		this.chunkUpdatesSent += sent;
		this.chunkBytesSent += bytesSent;
	}

	/**
	 * Flushes all queued RPC calls into a single packet and transmits it. Called
	 * every tick (≈10 ms). Keep overrides O(1) to avoid increasing latency for
	 * the whole server.
	 */
	transferQueue() {
		this.flushPrioritizedChunkSends();
		if (!this.q.empty()) {
			const packet = this.q.flush();
			this.bytesSent += packet.length;
			this.msgsSent++;
			this.socket.send(packet);
		}
	}

	/**
	 * Broadcasts the current roster (id, name, status, deaths, kills) to every
	 * connected client. Invoked after relevant state changes and periodically by
	 * the server to keep late joiners in sync.
	 */
	broadcastPlayerList() {
		const playerList = Array.from(this.server.sockets.values()).map(
			(client) => ({
				id: client.id,
				name: client.playerName,
				status: client.playerStatus,
				deaths: client.deaths,
				kills: client.kills,
			}),
		);

		for (const client of this.server.sockets.values()) {
			client.q.call("playerList", playerList);
		}
	}
}
