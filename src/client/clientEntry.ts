/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Represents the client-side mirror of a player that currently exists on the
 * server.
 *
 * A `ClientEntry` is intentionally lightweight – it only stores information
 * that the UI must present (player name, presence state and simple lifetime
 * statistics). Anything game-play related such as position, velocity,
 * equipment, etc. is managed by the corresponding `Entity` instances that live
 * in `world.entities`.
 *
 * How to obtain one:
 *  • Never instantiate this class directly. Listen for the `"playerList"`
 *    packets dispatched by `ClientNetwork`. That handler takes care of
 *    creating new entries and keeping `game.clients` in sync with the server.
 *
 * How to extend:
 *  • If you want to cache additional meta-data you can derive your own
 *    subclass. Remember to:
 *      1. Call `super.constructor(game, id)` so the base fields are
 *         initialised.
 *      2. Call `super.update(msg)` inside your overridden `update` method
 *         before touching any of your own fields.
 *
 * Foot-guns / caveats:
 *  • All fields except `id` are overwritten wholesale inside `update()`. Do
 *    not rely on incremental updates.
 *  • Do **not** mutate the public fields from the outside – keep all server
 *    authoritative data flowing through `update()` to avoid de-syncs.
 *  • `id` must remain constant or the map key in `game.clients` will break.
 *  • The class is not reactive by itself. If your UI framework relies on
 *    reactivity you need to wrap the instance or its fields accordingly.
 *
 * The `status` flag can be one of:
 *  ""        – player is alive and active
 *  "dead"    – player is dead but has not yet respawned
 *  "typing"  – player is currently chatting (input is focused)
 *  "afk"     – player has been flagged as away-from-keyboard by the server
 */
import type { Game } from "../game";

export type PlayerStatus = "" | "dead" | "typing" | "afk";

export interface PlayerUpdate {
	id: number;
	name: string;
	status: PlayerStatus;
	deaths: number;
	kills: number;
}

export class ClientEntry {
	id: number;
	name = "";
	status: PlayerStatus = "";
	deaths = 0;
	kills = 0;

	constructor(game: Game, id: number) {
		this.id = id;
	}

	/**
	 * Refresh the cached data with the latest snapshot received from the
	 * server. All fields are overwritten – never supply a partial structure.
	 */
	update(msg: PlayerUpdate) {
		this.name = msg.name;
		this.status = msg.status;
		this.deaths = msg.deaths;
		this.kills = msg.kills;
	}
}
