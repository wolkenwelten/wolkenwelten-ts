/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { WebSocket } from "ws";
import type { Server } from "./server";
import type { WSHelloMessage, WSMessage, WSPlayerUpdate } from "../network";
import { handler } from "./handler";

let idCounter = 0;
export class ClientConnection {
	private socket: WebSocket;

	id: number;
	playerName = "";
	server: Server;

	x = 0;
	y = 0;
	z = 0;

	yaw = 0;
	pitch = 0;

	health = 10;
	maxHealth = 10;

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
		this.send(helloMsg);

		socket.on("close", () => {
			console.log(`Closing connection`);
			server.sockets.delete(that.id);
		});

		socket.on("message", (msg) => {
			try {
				that.dispatch(JSON.parse(msg.toString()));
			} catch (e) {
				console.error(e);
			}
		});
	}

	dispatch(msg: any) {
		const fun = handler.get(msg.T) || console.error;
		fun(this, msg);
	}

	send(msg: WSMessage) {
		this.socket.send(JSON.stringify(msg));
	}
}
