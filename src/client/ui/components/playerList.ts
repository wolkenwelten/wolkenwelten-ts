/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { PlayerStatus } from "../../clientEntry";
import type { ClientGame } from "../../clientGame";
import { Div } from "../utils";
import styles from "./playerList.module.css";

export class PlayerList {
	div: HTMLElement;
	game: ClientGame;

	constructor(parent: HTMLElement, game: ClientGame) {
		this.game = game;
		parent.appendChild((this.div = Div({ class: styles.playerList })));
	}

	update() {
		const playerList = Array.from(this.game.clients.values()).map((client) => ({
			id: client.id,
			name: client.name,
			status: client.status,
		}));

		this.div.innerHTML = "";
		for (const player of playerList) {
			const playerDiv = Div({
				text: `${this.getStatusIcon(player.status)}${player.name}`,
			});
			this.div.append(playerDiv);
		}
	}

	getStatusIcon(status: PlayerStatus) {
		switch (status) {
			case "typing":
				return "💬 ";
			case "afk":
				return "💤 ";
			case "dead":
				return "💀 ";
			default:
				return "";
		}
	}
}
