/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../game";
import type {
	WSMessage,
	WSPlayerUpdate,
	WSChunkUpdate,
	WSMultiMessage,
	WSPlayerHit,
} from "../network";
import { ClientEntry } from "./clientEntry";
import { ClientNetwork } from "./clientNetwork";

export class ClientGame {
	game: Game;
	private ws?: WebSocket;
	private handler: Map<string, (msg: WSMessage) => void> = new Map();
	clients: Map<number, ClientEntry> = new Map();

	readonly network: ClientNetwork;

	constructor(game: Game) {
		this.game = game;
		this.network = new ClientNetwork(this);
		this.connect();
		this.addDefaultHandler();
		setInterval(this.transfer.bind(this), 8);

		this.network.setPlayerName(this.game.options.playerName);
	}

	private addDefaultHandler() {
		const game = this.game;
		game.client = this;

		this.setHandler("packet", () => {});

		this.setHandler("multi", (raw: WSMessage) => {
			const msg = raw as WSMultiMessage;
			for (const call of msg.calls) {
				this.dispatch(call);
			}
		});

		this.setHandler("playerUpdate", (raw: WSMessage) => {
			const msg = raw as WSPlayerUpdate;
			const cli = this.clients.get(msg.playerID);
			if (!cli) {
				const cli = new ClientEntry(this.game, msg.playerID);
				this.clients.set(msg.playerID, cli);
				cli.update(msg);
			} else {
				cli.update(msg);
			}
		});

		this.setHandler("chunkUpdate", (raw: WSMessage) => {
			const msg = raw as WSChunkUpdate;
			const chunk = game.world.getOrGenChunk(msg.x, msg.y, msg.z);
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

		this.setHandler("playerHit", (raw: WSMessage) => {
			const msg = raw as WSPlayerHit;
			const attacker = this.clients.get(msg.playerID);
			if (!attacker) return;

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

	private setHandler(T: string, handler: (msg: WSMessage) => void) {
		this.handler.set(T, handler);
	}

	private connect() {
		if (this.ws) {
			this.ws.close();
		}
		this.ws = new WebSocket("ws://localhost:8080");
		const that = this;
		this.ws.onmessage = (ev) => {
			const raw = ev.data || "";
			const msg = JSON.parse(raw);
			if (typeof msg.T !== "string") {
				console.error(msg);
				throw new Error("Invalid message received");
			}
			if (msg.T === "multi") {
				const multi = msg as WSMultiMessage;
				for (const call of multi.calls) {
					that.dispatch(call);
				}
			} else {
				that.dispatch(msg);
			}
		};
		this.ws.onclose = () => {
			that.ws = undefined;
		};
	}

	dispatch(msg: WSMessage) {
		const handler = this.handler.get(msg.T);
		if (!handler) {
			console.error("Received unknown Message:");
			console.error(msg);
		} else {
			handler(msg);
		}
	}

	private transfer() {
		if (!this.ws) {
			this.connect();
			return;
		}
		if (this.ws.readyState !== this.ws.OPEN) {
			return;
		}
		this.game.network.sendPlayerUpdate(
			this.game.options.playerName,
			this.game.player,
		);

		const multi: WSMultiMessage = {
			T: "multi",
			calls: this.game.network.queue,
		};
		this.ws.send(JSON.stringify(multi));
		this.game.network.queue.length = 0;
	}
}
