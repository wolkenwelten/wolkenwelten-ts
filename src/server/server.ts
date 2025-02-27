/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game, GameConfig } from "../game";
import { WebSocketServer, WebSocket } from "ws";
import { ClientConnection } from "./connection";

export class ServerGame extends Game {
	isServer = true;
	wss: WebSocketServer;
	sockets: Map<number, ClientConnection> = new Map();

	onConnect(socket: WebSocket) {
		const con = new ClientConnection(this, socket);
		this.sockets.set(con.id, con);
	}

	constructor(config: GameConfig) {
		super(config);
		this.wss = new WebSocketServer({ port: 8080 });
		this.wss.on("connection", this.onConnect.bind(this));

		const server = this;
		setInterval(() => {
			for (const con of server.sockets.values()) {
				con.transferQueue();
			}
			this.update();
		}, 10);

		console.log("Starting WolkenWelten Server on port 8080");
	}
}
