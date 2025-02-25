/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../game";
import type {
	WSMessage,
	WSChatMessage,
	WSHelloMessage,
	WSPlayerUpdate,
	WSChunkUpdate,
	WSMultiMessage,
} from "../network";
import { ClientEntry } from "./clientEntry";

export class ClientGame {
	game: Game;
	private ws?: WebSocket;
	private handler: Map<string, (msg: WSMessage) => void> = new Map();
	clients: Map<number, ClientEntry> = new Map();

	constructor(game: Game) {
		this.game = game;
		this.connect();
		this.addDefaultHandler();
		setInterval(this.transfer.bind(this), 8);
	}

	private addDefaultHandler() {
		const game = this.game;

		this.setHandler("msg", (raw: WSMessage) => {
			const msg = raw as WSChatMessage;
			game.ui.log.addEntry(msg.msg);
		});

		this.setHandler("hello", (raw: WSMessage) => {
			const msg = raw as WSHelloMessage;
			game.network.id = msg.playerID;
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
			console.log("Chunk updated");
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
		this.game.network.sendNameChange(this.game.options.playerName);
	}

	private dispatch(msg: WSMessage) {
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
