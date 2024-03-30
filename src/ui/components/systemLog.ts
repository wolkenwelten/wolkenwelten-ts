/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../../game";
import { Div } from "../utils";
import styles from "./systemLog.module.css";

export class SystemLog {
	div: HTMLElement;
	game: Game;

	constructor(parent: HTMLElement, game: Game) {
		this.game = game;
		parent.appendChild((this.div = Div({ class: styles.systemLog })));
	}

	addEntry(text: string) {
		const entry = Div({ text });
		this.div.append(entry);
		entry.getBoundingClientRect();
		entry.classList.add(styles.visible);

		setTimeout(() => {
			entry.classList.remove(styles.visible);
		}, 30000);
		setTimeout(() => {
			entry.remove();
		}, 32000);
	}

	update() {}
}
