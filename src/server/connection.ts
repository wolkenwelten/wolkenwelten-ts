/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { WebSocket } from "ws";
import type { ServerGame } from "./serverGame";
import { WSPacket, WSQueue } from "../network";
import { coordinateToWorldKey } from "../world/world";
import { Chunk } from "../world/chunk/chunk";

let idCounter = 0;
export class ClientConnection {
	private socket: WebSocket;

	id: number;
	playerName = "";
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

	chunkVersions = new Map<number, number>();

	q: WSQueue = new WSQueue();

	getChunkVersion(x: number, y: number, z: number): number {
		return this.chunkVersions.get(coordinateToWorldKey(x, y, z)) || 0;
	}

	setChunkVersion(x: number, y: number, z: number, version: number) {
		this.chunkVersions.set(coordinateToWorldKey(x, y, z), version);
	}

	private close() {
		for (const entity of this.server.world.entities.values()) {
			if (entity.ownerID === this.id) {
				entity.destroy();
			}
		}
		this.server.sockets.delete(this.id);
	}

	constructor(server: ServerGame, socket: WebSocket) {
		this.id = ++idCounter;
		this.socket = socket;
		this.server = server;

		socket.on("close", () => {
			console.log(`Closing connection`);
			this.close();
		});

		socket.on("message", (msg) => {
			try {
				const raw = JSON.parse(msg.toString());
				if (raw.T === "packet") {
					const packet = raw as WSPacket;
					this.q.handlePacket(packet);
				}
			} catch (e) {
				console.error(e);
			}
		});

		this.registerDefaultHandlers();
	}

	private broadcastEntities() {
		const entities = [];
		for (const entity of this.server.world.entities.values()) {
			if (entity.ownerID === this.id) {
				continue;
			}
			entities.push(entity.serialize());
		}
		this.q.call("updateEntities", entities);
	}

	registerDefaultHandlers() {
		this.q.registerCallHandler("getPlayerID", async (args: unknown) => {
			console.log("getPlayerID", args, this.id);
			return this.id;
		});

		this.q.registerCallHandler("updateEntities", async (args: unknown) => {
			if (!Array.isArray(args)) {
				throw new Error("Invalid entities received");
			}
			const entities = args as any[];
			for (const e of entities) {
				const entity = this.server.world.deserializeEntity(e);
				if (entity && entity.ownerID === this.id && entity.T === "Character") {
					this.x = entity.x;
					this.y = entity.y;
					this.z = entity.z;
					this.yaw = entity.yaw;
					this.pitch = entity.pitch;
				}
			}
			this.broadcastEntities();
			this.updateChunkVersions();
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

			// Create binary message for chunk update
			// Format: [messageType(1), x(4), y(4), z(4), version(4), data(32*32*32)]
			const buffer = new ArrayBuffer(17 + chunk.blocks.length);
			const view = new DataView(buffer);

			// Message type 1 = chunk update
			view.setUint8(0, 1);

			// Chunk coordinates and version
			view.setInt32(1, chunk.x, true);
			view.setInt32(5, chunk.y, true);
			view.setInt32(9, chunk.z, true);
			view.setUint32(13, chunk.lastUpdated, true);

			// Copy chunk data
			const uint8View = new Uint8Array(buffer, 17);
			uint8View.set(chunk.blocks);

			// Send binary data directly
			this.socket.send(buffer);

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

	chunkUpdateLoop(rMax: number) {
		// Process chunks in a rough inside-out pattern
		let updates = 0;
		for (let r = 0; r <= rMax; r++) {
			// radius from center
			const s = Math.max(1, r);
			for (let ox = -r; ox <= r; ox += s) {
				for (let oy = -r; oy <= r; oy += s) {
					for (let oz = -r; oz <= r; oz += s) {
						if (this.maybeUpdateChunk(ox, oy, oz)) {
							if (++updates > 16) {
								console.log(`Sent 16 chunk updates`);
								return;
							}
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
		if ((++this.updates & 0xf) == 0) {
			this.chunkUpdateLoop(16);
		} else {
			this.chunkUpdateLoop(5);
		}
	}

	transferQueue() {
		if (!this.q.empty()) {
			const packet = this.q.flush();
			this.socket.send(packet);
		}
	}

	broadcastPlayerList() {
		const playerList = Array.from(this.server.sockets.values()).map(
			(client) => ({
				id: client.id,
				name: client.playerName,
			}),
		);

		for (const client of this.server.sockets.values()) {
			client.q.call("playerList", playerList);
		}
	}
}
