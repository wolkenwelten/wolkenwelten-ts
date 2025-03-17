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
		console.log("onConnect");
		const con = new ClientConnection(this, socket);
		this.sockets.set(con.id, con);
	}

	broadcastSystems() {
		const msg = this.world.fire.serialize();
		console.log(msg);
		for (const con of this.sockets.values()) {
			con.q.call("fireUpdate", msg);
		}
	}

	constructor(config: GameConfig) {
		super(config);
		this.running = true;
		this.wss = new WebSocketServer({ port: 8080 });
		this.wss.on("connection", this.onConnect.bind(this));
		this.wss.on("error", (error) => {
			console.error(`(╥﹏╥) WebSocketServer error:`, error);
		});

		this.wss.on("close", () => {
			console.log(`(｡•́︿•̀｡) WebSocketServer closed`);
		});

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
