/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../game";
import { WebSocketServer, WebSocket } from "ws";
import { ClientConnection } from "./connection";
import type { WSMessage } from "../network";

export class Server {
	game: Game;
	wss: WebSocketServer;
	sockets: Map<number, ClientConnection> = new Map();

	sendAll(msg: WSMessage) {
		for (const s of this.sockets.values()) {
			s.send(msg);
		}
	}

	onConnect(socket: WebSocket) {
		const con = new ClientConnection(this, socket);
		this.sockets.set(con.id, con);
	}

	constructor(game: Game) {
		this.game = game;
		this.wss = new WebSocketServer({ port: 8080 });
		this.wss.on("connection", this.onConnect.bind(this));

		const server = this;
		setInterval(() => {
			for (const con of server.sockets.values()) {
				con.transferQueue();
			}
			game.update();
		}, 10);

		console.log("Starting WolkenWelten Server on port 8080");
	}
}
