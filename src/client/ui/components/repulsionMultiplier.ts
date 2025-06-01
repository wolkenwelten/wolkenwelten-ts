/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { ClientGame } from "../../clientGame";
import { Div } from "../utils";
import styles from "./repulsionMultiplier.module.css";

export class RepulsionMultiplier {
	div: HTMLElement;
	game: ClientGame;

	constructor(parent: HTMLElement, game: ClientGame) {
		this.game = game;
		parent.appendChild((this.div = Div({ class: styles.repulsion })));
	}

	update() {
		const percent =
			Math.round((this.game.player?.repulsionMultiplier || 0) * 1000 - 1000) /
			10;
		this.div.setAttribute("data-value", `${percent}%`);
		this.div.style.setProperty("--fill-percent", `${percent}%`);
	}
}
