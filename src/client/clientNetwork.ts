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

	private static readonly defaultHandlers: Map<string, ClientHandler> =
		new Map();

	static addDefaultHandler(T: string, handler: ClientHandler) {
		this.defaultHandlers.set(T, handler);
	}

	private onMessage(ev: MessageEvent) {
		const raw = ev.data || "";
		const msg = JSON.parse(raw);
		if (typeof msg.T !== "string") {
			console.error(msg);
			throw new Error("Invalid message received");
		}

		if (msg.T === "packet") {
			this.queue.handlePacket(msg as WSPacket);
		}
	}

	private flushRawQueue() {
		if (!this.ws) {
			throw new Error("WebSocket not connected");
		}

		if (this.rawQueue.length <= 0) {
			return;
		}

		for (const raw of this.rawQueue) {
			this.ws.send(raw);
		}
		this.rawQueue.length = 0;
	}

	private onConnect() {
		this.flushRawQueue();
	}

	private close() {
		if (!this.ws) {
			return;
		}

		this.ws.close();
		this.ws = undefined;
	}

	private connect() {
		this.ws = new WebSocket("ws://localhost:8080");
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

		this.playerUpdate(this.game.player);
		this.sendRaw(this.queue.flush());
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

		this.queue.registerCallHandler("chunkUpdate", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid chunk update received");
			}
			const msg = args as any;
			const chunk = this.game.world.getOrGenChunk(msg.x, msg.y, msg.z);
			// Decode base64 string back to Uint8Array
			const blocks = new Uint8Array(
				atob(msg.blocks)
					.split("")
					.map((c) => c.charCodeAt(0)),
			);

			chunk.blocks.set(blocks, 0);
			chunk.lastUpdated = msg.lastUpdated;
			chunk.loaded = true;
			chunk.invalidate();
		});

		this.queue.registerCallHandler("playerHit", async (args: unknown) => {
			if (typeof args !== "object") {
				throw new Error("Invalid player hit received");
			}
			const msg = args as any;
			const attacker = this.game.clients.get(msg.playerID);
			if (!attacker) return;

			const game = this.game;

			// Start hit animation for the attacking player
			attacker.char.hitAnimation = game.render.frames;
			attacker.char.hitAnimationCounter =
				(attacker.char.hitAnimationCounter + 1) & 1;

			// Check if we (the local player) are in range and should take damage
			const dx = game.player.x - attacker.char.x;
			const dy = game.player.y - attacker.char.y;
			const dz = game.player.z - attacker.char.z;
			const dd = dx * dx + dy * dy + dz * dz;

			if (dd <= msg.radius * msg.radius) {
				game.player.damage(msg.damage);
				game.player.onAttack(attacker.char);

				// Calculate knockback direction and magnitude
				const dist = Math.sqrt(dd);
				if (dist > 0) {
					// Normalize direction vector
					const ndx = dx / dist;
					const ndz = dz / dist;

					// Base knockback + additional based on damage
					const knockbackForce = 0.2 + msg.damage * 0.1;

					// Apply horizontal knockback
					game.player.vx += ndx * knockbackForce;
					game.player.vz += ndz * knockbackForce;

					// Add some vertical knockback for a more dramatic effect
					game.player.vy += knockbackForce * 0.5;
				}
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

	async playerUpdate(player: Character): Promise<void> {
		await this.queue.call("playerUpdate", {
			x: player.x,
			y: player.y,
			z: player.z,

			yaw: player.yaw,
			pitch: player.pitch,

			health: player.health,
			maxHealth: player.maxHealth,
		});
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

	async playerHit(playerID: number, radius: number, damage: number) {
		await this.queue.call("playerHit", {
			playerID,
			radius,
			damage,
		});
	}
}
