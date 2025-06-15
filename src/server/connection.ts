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
import { WSPacket, WSQueue } from "../network";
import { coordinateToWorldKey } from "../world/world";
import { Chunk } from "../world/chunk/chunk";
import type { PlayerStatus } from "../client/clientEntry";
import { Character } from "../world/entity/character";
import { NetworkObject } from "../world/entity/networkObject";

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

	chunkVersions = new Map<number, number>();
	private chunkBuffer = new ArrayBuffer(20 + 32 * 32 * 32);

	q: WSQueue = new WSQueue();

	private pendingForceUpdates: NetworkObject[] = [];

	forceUpdateNetworkObject(obj: NetworkObject) {
		this.pendingForceUpdates.push(obj);
	}

	getChunkVersion(x: number, y: number, z: number): number {
		return this.chunkVersions.get(coordinateToWorldKey(x, y, z)) || 0;
	}

	setChunkVersion(x: number, y: number, z: number, version: number) {
		this.chunkVersions.set(coordinateToWorldKey(x, y, z), version);
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
			} catch (e) {
				console.error(e);
			}
		});

		this.debugInterval = setInterval(() => {
			const kbpsIn = this.bytesReceived / 1024;
			const kbpsOut = this.bytesSent / 1024;
			if (this.server.options.debug) {
				console.log(
					`Bytes sent: ${kbpsOut}kbps (${this.msgsSent} msgs), bytes received: ${kbpsIn}kbps (${this.msgsReceived} msgs)`,
				);
			}
			this.bytesSent = 0;
			this.bytesReceived = 0;
			this.msgsSent = 0;
			this.msgsReceived = 0;
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
				this.broadcastNetworkObjects();
				this.updateChunkVersions();
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

		this.q.registerCallHandler("chunkDrop", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid chunk drop received");
			}
			const drop = args as any;
			this.server.world.setBlock(drop.x, drop.y, drop.z, 0);
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

	clientUpdateChunk(chunk: Chunk): boolean {
		const clientVersion = this.getChunkVersion(chunk.x, chunk.y, chunk.z);
		const serverVersion = chunk.lastUpdated;

		if (clientVersion == serverVersion) {
			return false;
		} else if (clientVersion > serverVersion) {
			throw new Error(
				"Client has a higher version than the server, this should never happen",
			);
		} else {
			this.setChunkVersion(chunk.x, chunk.y, chunk.z, serverVersion);

			if (chunk.isEmpty()) {
				this.q.call("emptyChunk", {
					x: chunk.x,
					y: chunk.y,
					z: chunk.z,
					version: chunk.lastUpdated,
				});
				return false;
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

			return true;
		}
	}

	maybeUpdateChunk(ox: number, oy: number, oz: number): boolean {
		const x = this.x + ox * 32;
		const y = this.y + oy * 32;
		const z = this.z + oz * 32;

		const chunk = this.server.world.getOrGenChunk(x, y, z);
		return this.clientUpdateChunk(chunk);
	}

	chunkUpdateLoop(r: number) {
		// Process chunks in a rough inside-out pattern
		let updates = 0;

		for (let ox = -r; ox <= r; ox++) {
			for (let oy = -r; oy <= r; oy++) {
				for (let oz = -r; oz <= r; oz++) {
					if (this.maybeUpdateChunk(ox, oy, oz)) {
						if (++updates > 4) {
							console.log(`Sent ${updates} chunk updates`);
							return;
						}
					}
				}
			}
		}

		if (updates > 0) {
			console.log(`Sent ${updates} chunk updates`);
		}
	}

	updateChunkVersions() {
		this.chunkUpdateLoop(1);
		this.chunkUpdateLoop(4);
		this.chunkUpdateLoop(8);
	}

	/**
	 * Flushes all queued RPC calls into a single packet and transmits it. Called
	 * every tick (≈10 ms). Keep overrides O(1) to avoid increasing latency for
	 * the whole server.
	 */
	transferQueue() {
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
