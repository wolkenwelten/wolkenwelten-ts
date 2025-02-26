/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { WSPacket, WSQueue } from "../network";
import { ClientGame } from "./clientGame";
export type ClientHandler = (game: ClientGame, args: unknown) => Promise<void>;

export class ClientNetwork {
	private ws?: WebSocket;
	private readonly queue: WSQueue;
	private readonly client: ClientGame;
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

		this.sendRaw(this.queue.flush());
	}

	constructor(client: ClientGame) {
		this.client = client;
		this.queue = new WSQueue();
		this.connect();
		setInterval(this.transfer.bind(this), 8);
	}

	async getPlayerID(): Promise<number> {
		const val = await this.queue.call("getPlayerID");
		if (typeof val !== "number") {
			throw new Error("Invalid player ID received");
		}
		return val;
	}
}
