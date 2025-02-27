/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { WebSocket } from "ws";
import type { ServerGame } from "./server";
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

	chunkVersions = new Map<number, number>();

	q: WSQueue = new WSQueue();

	getChunkVersion(x: number, y: number, z: number): number {
		return this.chunkVersions.get(coordinateToWorldKey(x, y, z)) || 0;
	}

	setChunkVersion(x: number, y: number, z: number, version: number) {
		this.chunkVersions.set(coordinateToWorldKey(x, y, z), version);
	}

	constructor(server: ServerGame, socket: WebSocket) {
		this.id = ++idCounter;
		this.socket = socket;
		this.server = server;
		const that = this;

		socket.on("close", () => {
			console.log(`Closing connection`);
			server.sockets.delete(that.id);
		});

		socket.on("message", (msg) => {
			try {
				const raw = JSON.parse(msg.toString());
				if (raw.T === "packet") {
					const packet = raw as WSPacket;
					that.q.handlePacket(packet);
				}
			} catch (e) {
				console.error(e);
			}
		});

		this.registerDefaultHandlers();
	}

	registerDefaultHandlers() {
		this.q.registerCallHandler("getPlayerID", async (args: unknown) => {
			console.log("getPlayerID", args, this.id);
			return this.id;
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

		this.q.registerCallHandler("playerUpdate", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid player update received");
			}
			const update = args as any;

			this.x = update.x;
			this.y = update.y;
			this.z = update.z;

			this.yaw = update.yaw;
			this.pitch = update.pitch;

			this.health = update.health;
			this.maxHealth = update.maxHealth;

			this.updateOtherPlayers();
			this.updateChunkVersions();
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

			// Convert Uint8Array to base64 string
			const blocks = Buffer.from(chunk.blocks).toString("base64");

			this.q.call("chunkUpdate", {
				x: chunk.x,
				y: chunk.y,
				z: chunk.z,
				lastUpdated: chunk.lastUpdated,
				blocks,
			});
			return true;
		}
	}

	chunkUpdateLoop(rMax: number) {
		// Process chunks in a rough inside-out pattern
		let updates = 0;
		for (let r = 0; r <= rMax; r++) {
			// radius from center
			for (let ox = -r; ox <= r; ox++) {
				for (let oy = -r; oy <= r; oy++) {
					for (let oz = -r; oz <= r; oz++) {
						// Only process blocks at current "shell" radius
						if (
							Math.abs(ox) !== r &&
							Math.abs(oy) !== r &&
							Math.abs(oz) !== r
						) {
							continue;
						}

						const x = this.x + ox * 32;
						const y = this.y + oy * 32;
						const z = this.z + oz * 32;

						const chunk = this.server.world.getOrGenChunk(x, y, z);
						if (this.clientUpdateChunk(chunk)) {
							if (++updates > 20) {
								break;
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
		if ((++this.updates & 0x1f) == 0) {
			this.chunkUpdateLoop(5);
		} else {
			this.chunkUpdateLoop(2);
		}
	}

	updateOtherPlayers() {
		for (const client of this.server.sockets.values()) {
			if (client === this) {
				continue;
			}
			// Can be removed once we only use the queue
			if (client.playerName === "") {
				continue;
			}

			this.q.call("playerUpdate", {
				id: client.id,
				name: client.playerName,

				x: client.x,
				y: client.y,
				z: client.z,
				yaw: client.yaw,
				pitch: client.pitch,

				health: client.health,
				maxHealth: client.maxHealth,
			});
		}
	}

	transferQueue() {
		if (!this.q.empty()) {
			const packet = this.q.flush();
			this.socket.send(packet);
		}
	}
}
