/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { PlayerStatus } from "../../clientEntry";
import type { ClientGame } from "../../clientGame";
import { Div, Span } from "../utils";
import styles from "./playerList.module.css";

export class PlayerList {
	div: HTMLElement;
	game: ClientGame;

	constructor(parent: HTMLElement, game: ClientGame) {
		this.game = game;
		parent.appendChild((this.div = Div({ class: styles.playerList })));
	}

	update() {
		const playerList = Array.from(this.game.clients.values());
		playerList.sort((a, b) => b.kills - a.kills);

		this.div.innerHTML = "";
		for (const player of playerList) {
			const playerDiv = Div({
				class: styles.player,
				children: [
					Span({
						text: `${this.getStatusIcon(player.status)}${player.name} `,
						class: styles.name,
					}),
					Span({ text: `[${player.kills} 💪]`, class: styles.kills }),
					Span({ text: `[${player.deaths} 💀]`, class: styles.deaths }),
				],
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
