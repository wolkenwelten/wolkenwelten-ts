/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../game";
import { Character } from "../world/entity/character";

export interface PlayerUpdate {
	id: number;
	name: string;

	x: number;
	y: number;
	z: number;

	yaw: number;
	pitch: number;

	health: number;
	maxHealth: number;

	animation: number;
	animationId: number;
}

export class ClientEntry {
	id: number;
	name = "";

	char: Character;

	constructor(game: Game, id: number) {
		this.id = id;
		this.char = new Character(game.world);
	}

	update(msg: PlayerUpdate) {
		this.name = msg.name;

		this.char.networkUpdate(msg);
	}
}
