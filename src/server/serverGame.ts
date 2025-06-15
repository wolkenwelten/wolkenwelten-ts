/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * ServerGame – authoritative server wrapper around the shared `Game` logic.
 *
 * Usage:
 *   1. Instantiate once when you bring up your Node JS service.
 *      const game = new ServerGame(customConfig);
 *   2. Forward every new websocket from your HTTP(S)/WS server:
 *      wss.on("connection", ws => game.onConnect(ws));
 *
 * Lifecycle & Internals:
 *   • The constructor starts two timers immediately:
 *       – every 10 ms → `update()` advances the simulation, `broadcastSystems()`
 *         is called and all `ClientConnection` queues are flushed.
 *       – every 10 s → a full player-list broadcast is sent; connections that
 *         have not sent packets for >3 cycles are pruned.
 *   • New websockets are wrapped in `ClientConnection` via `onConnect()` and
 *     stored in the `sockets` Map keyed by their numeric id.
 *
 * Extension points:
 *   • `broadcastSystems()` – override to serialise and push ECS system state
 *     (e.g. chunk diffs, lighting updates, combat logs…).  Called for every
 *     tick, right after `update()`.
 *   • `onConnect()` – override for authentication or custom handshake but
 *     remember to call `super.onConnect(socket)` so the base bookkeeping runs.
 *
 * Footguns & Caveats:
 *   • The 10 ms tick is aggressive; heavy logic can cause drift and backlog –
 *     profile and tune if you scale up world complexity.
 *   • Do NOT mutate or delete entries in `sockets` directly; always use
 *     `ClientConnection.close()` so reference counting and queues are cleaned
 *     up properly.
 *   • Because the constructor starts timers right away, a subclass must finish
 *     initialising its own fields *before* calling `super()` or guard against
 *     early ticks that might access un-initialised state.
 */
import { Game, type GameConfig } from "../game";
import { type WebSocket } from "ws";
import { ClientConnection } from "./connection";
import type { NetworkObject } from "../world/entity";

import "../world/entity/character";

export interface ServerGameConfig extends GameConfig {}

export class ServerGame extends Game {
	isServer = true;
	sockets: Map<number, ClientConnection> = new Map();

	/**
	 * Wrap an incoming websocket in a `ClientConnection`, register it in the
	 * `sockets` map and send the initial player list to everyone.  Override to
	 * add authentication or custom handshake steps, but make sure to invoke
	 * `super.onConnect(socket)` so base bookkeeping is not skipped.
	 */
	onConnect(socket: WebSocket) {
		const con = new ClientConnection(this, socket);
		this.sockets.set(con.id, con);
		con.broadcastPlayerList();
	}

	forceUpdateNetworkObject(obj: NetworkObject) {
		for (const con of this.sockets.values()) {
			con.forceUpdateNetworkObject(obj);
		}
	}

	/**
	 * Stub for per-tick server broadcasts (e.g. system-wide ECS diffs).
	 * A subclass should override this method to push state to clients after the
	 * simulation step but before packet queues are flushed.
	 */
	broadcastSystems() {}

	/**
	 * Creates the game instance and immediately starts the simulation and
	 * maintenance timers.
	 *
	 * Timers:
	 *   – 10 ms: `update()` + `broadcastSystems()` + connection queue flush.
	 *   – 10 s:  player-list broadcast and idle-connection pruning.
	 *
	 * Adjust the intervals if your game world is either trivial (increase) or
	 * very heavy (decrease) to keep latency and CPU usage balanced.
	 */
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
				if (++sock.updatesWithoutPackets > 3) {
					sock.close();
				}
			}
		}, 10000);
	}
}
