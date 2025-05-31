/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { WSPacket, WSQueue } from "../network";
import { Character } from "../world/entity/character";
import { ClientEntry } from "./clientEntry";
import type { ClientGame } from "./clientGame";
export type ClientHandler = (game: ClientGame, args: unknown) => Promise<void>;

export class ClientNetwork {
	private ws?: WebSocket;
	private readonly queue: WSQueue;
	private readonly game: ClientGame;
	private readonly rawQueue: string[] = [];
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectTimeout?: NodeJS.Timeout;

	private static readonly defaultHandlers: Map<string, ClientHandler> =
		new Map();

	static addDefaultHandler(T: string, handler: ClientHandler) {
		this.defaultHandlers.set(T, handler);
	}

	private onArrayBuffer(data: ArrayBuffer) {
		const view = new DataView(data);
		const messageType = view.getUint8(0);

		// Message type 1 = chunk update
		if (messageType === 1) {
			const x = view.getInt32(1, true);
			const y = view.getInt32(5, true);
			const z = view.getInt32(9, true);
			const version = view.getUint32(13, true);

			// Get the chunk data
			const blocks = new Uint8Array(data.slice(17));

			// Update the chunk
			const chunk = this.game.world.getOrGenChunk(x, y, z);
			chunk.blocks.set(blocks, 0);
			chunk.lastUpdated = version;
			chunk.loaded = true;
			chunk.invalidate();

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

	private flushRawQueue() {
		if (!this.ws) {
			throw new Error("WebSocket not connected");
		}

		if (this.game.player) {
			this.playerUpdate(this.game.player);
		}
		for (const raw of this.rawQueue) {
			this.ws.send(raw);
		}
		this.rawQueue.length = 0;
	}

	private onConnect() {
		console.log("(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ Connected to server!");
		this.reconnectAttempts = 0;
		this.flushRawQueue();
	}

	private close(event?: CloseEvent | Event) {
		console.log("(｡•́︿•̀｡) Connection closed, attempting reconnect...");
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
		const url = `${protocol}//${window.location.hostname}:8080`;
		console.log("Connecting to", url);
		this.ws = new WebSocket(url);
		this.ws.onmessage = this.onMessage.bind(this);
		this.ws.onopen = this.onConnect.bind(this);
		this.ws.onclose = this.close.bind(this);
		this.ws.onerror = this.close.bind(this);
	}

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

	private transfer() {
		if (!this.ws || this.ws.readyState !== this.ws.OPEN) {
			return;
		}

		this.sendRaw(this.queue.flush());
	}

	update() {
		this.transfer();
	}

	constructor(client: ClientGame) {
		this.game = client;
		this.queue = new WSQueue();
		this.addDefaultHandlers();
		this.connect();
		setInterval(this.transfer.bind(this), 8);
	}

	private addDefaultHandlers() {
		this.queue.registerCallHandler("addLogEntry", async (args: unknown) => {
			if (typeof args !== "string") {
				throw new Error("Invalid log entry received");
			}
			const msg = args as string;
			this.game.ui.log.addEntry(msg);
		});

		this.queue.registerCallHandler("playerUpdate", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid player update received");
			}
			const o = args as any;
			const cli = this.game.clients.get(o.id);
			if (!cli) {
				const cli = new ClientEntry(this.game, o.id);
				this.game.clients.set(o.id, cli);
				cli.update(o);
			} else {
				cli.update(o);
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
			game.render?.particle.fxStrike(msg.px, msg.py, msg.pz);

			if (!game.player) {
				return;
			}

			// Check if we (the local player) are in range and should take damage
			const dx = game.player.x - msg.px;
			const dy = game.player.y - msg.py;
			const dz = game.player.z - msg.pz;
			const dd = dx * dx + dy * dy + dz * dz;

			if (dd <= msg.radius * msg.radius) {
				game.player.damage(msg.damage);
				if (attacker) {
					game.player.onAttack(attacker.char);
				}

				// Calculate knockback direction and magnitude
				const odx = game.player.x - msg.ox;
				const ody = game.player.y - msg.oy;
				const odz = game.player.z - msg.oz;
				const odist = odx * odx + ody * ody + odz * odz;
				const dist = Math.sqrt(odist);
				if (dist > 0) {
					// Normalize direction vector
					const ndx = odx / dist;
					const ndz = odz / dist;

					// Base knockback + additional based on damage
					const knockbackForce =
						0.2 + msg.damage * 0.1 * game.player.repulsionMultiplier;

					// Apply horizontal knockback
					game.player.vx += ndx * knockbackForce;
					game.player.vz += ndz * knockbackForce;

					// Add some vertical knockback for a more dramatic effect
					game.player.vy += knockbackForce * 0.2;
				}
			}
		});

		this.queue.registerCallHandler("playerList", async (args: unknown) => {
			if (!Array.isArray(args)) {
				throw new Error("Invalid player list received");
			}

			const playerList = args as { id: number; name: string }[];
			const validPlayerIds = new Set(playerList.map((player) => player.id));

			// Check for players that need to be removed
			for (const [id, client] of this.game.clients.entries()) {
				if (!validPlayerIds.has(id)) {
					// This player is no longer in the server's list, remove them
					client.char.destroy();
					this.game.clients.delete(id);
					this.game.ui.log.addEntry(`${client.name} left the game`);
					console.log(
						`Removed player ${client.name} (ID: ${id}) based on playerList update`,
					);
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

	async playerUpdate(player: Character): Promise<void> {
		await this.queue.call("playerUpdate", player.updateMessage());
	}

	async chunkDrop(x: number, y: number, z: number): Promise<void> {
		await this.queue.call("chunkDrop", {
			x,
			y,
			z,
		});
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
		});
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

	async fireAdd(
		x: number,
		y: number,
		z: number,
		strength: number,
	): Promise<void> {
		await this.queue.call("fireAdd", {
			x,
			y,
			z,
			strength,
		});
	}
}
