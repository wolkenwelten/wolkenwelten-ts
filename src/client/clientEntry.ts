/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../game";

export interface PlayerUpdate {
	id: number;
	name: string;
}

export class ClientEntry {
	id: number;
	name = "";

	constructor(game: Game, id: number) {
		this.id = id;
	}

	update(msg: PlayerUpdate) {
		this.name = msg.name;
	}
}
