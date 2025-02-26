/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../game";
import { ClientEntry } from "./clientEntry";
import { ClientNetwork } from "./clientNetwork";

export class ClientGame {
	game: Game;
	clients: Map<number, ClientEntry> = new Map();

	readonly network: ClientNetwork;

	constructor(game: Game) {
		this.game = game;
		this.network = new ClientNetwork(this);
		this.network.setPlayerName(this.game.options.playerName);
	}
}
