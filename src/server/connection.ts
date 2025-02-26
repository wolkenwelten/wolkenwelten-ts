/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { WebSocket } from "ws";
import type { Server } from "./server";
import {
	WSHelloMessage,
	WSMessage,
	WSMultiMessage,
	WSPacket,
	WSPlayerUpdate,
	WSQueue,
} from "../network";
import { handler } from "./handler";
import { coordinateToWorldKey } from "../world/world";

let idCounter = 0;
export class ClientConnection {
	private socket: WebSocket;

	id: number;
	playerName = "";
	server: Server;
	queue: WSMessage[] = [];

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

	getPlayerUpdateMsg(): WSPlayerUpdate {
		return {
			T: "playerUpdate",
			playerID: this.id,
			playerName: this.playerName,

			x: this.x,
			y: this.y,
			z: this.z,

			yaw: this.yaw,
			pitch: this.pitch,

			health: this.health,
			maxHealth: this.maxHealth,
		};
	}

	constructor(server: Server, socket: WebSocket) {
		this.id = ++idCounter;
		this.socket = socket;
		this.server = server;
		const that = this;

		const helloMsg: WSHelloMessage = {
			T: "hello",
			playerID: this.id,
		};
		this.sendRaw(helloMsg);

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
				} else if (raw.T === "multi") {
					const multi = raw as WSMultiMessage;
					for (const call of multi.calls) {
						that.dispatch(call);
					}
				} else {
					that.dispatch(raw);
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

		this.q.registerCallHandler("addLogEntry", async (args: unknown) => {
			const msg = this.playerName + ": " + args;
			console.log(msg);
			for (const client of this.server.sockets.values()) {
				client.q.call("addLogEntry", msg);
			}
			return "";
		});
	}

	dispatch(msg: any) {
		const fun = handler.get(msg.T) || console.error;
		fun(this, msg);
	}

	send(msg: WSMessage) {
		this.queue.push(msg);
	}

	sendRaw(msg: WSMessage) {
		this.socket.send(JSON.stringify(msg));
	}

	transferQueue() {
		if (this.queue.length > 0) {
			const msg: WSMultiMessage = {
				T: "multi",
				calls: this.queue,
			};
			this.sendRaw(msg);
			this.queue.length = 0;
		}

		if (!this.q.empty()) {
			const packet = this.q.flush();
			this.socket.send(packet);
		}
	}
}
