/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game, GameConfig } from "../game";
import { ClientEntry } from "./clientEntry";
import { ClientNetwork } from "./clientNetwork";

export class ClientGame extends Game {
	clients: Map<number, ClientEntry> = new Map();
	isClient = true;

	readonly network: ClientNetwork;

	constructor(config: GameConfig) {
		super(config);
		this.network = new ClientNetwork(this);
		this.network.setPlayerName(this.options.playerName);
	}
}
