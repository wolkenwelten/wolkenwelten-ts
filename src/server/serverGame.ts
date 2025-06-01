/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game, type GameConfig } from "../game";
import { type WebSocket } from "ws";
import { ClientConnection } from "./connection";

import "../world/entity/character";

export interface ServerGameConfig extends GameConfig {}

export class ServerGame extends Game {
	isServer = true;
	sockets: Map<number, ClientConnection> = new Map();

	onConnect(socket: WebSocket) {
		const con = new ClientConnection(this, socket);
		this.sockets.set(con.id, con);
		con.broadcastPlayerList();
	}

	broadcastSystems() {}

	constructor(config: ServerGameConfig = {}) {
		super(config);
		this.running = true;

		const server = this;
		setInterval(() => {
			this.update();
			this.broadcastSystems();
			for (const con of server.sockets.values()) {
				con.transferQueue();
			}
		}, 10);

		// Add this new interval to broadcast player list
		setInterval(() => {
			for (const sock of this.sockets.values()) {
				sock.broadcastPlayerList();
			}
		}, 10000);

		console.log("Starting WolkenWelten Server on port 8080");
	}
}
