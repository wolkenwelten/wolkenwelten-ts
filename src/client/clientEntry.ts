/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
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

	update(msg: PlayerUpdate) {
		this.name = msg.name;
		this.status = msg.status;
		this.deaths = msg.deaths;
		this.kills = msg.kills;
	}
}
