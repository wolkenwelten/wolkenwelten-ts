/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../../game";
import { Div } from "../utils";
import styles from "./chatPanel.module.css";

export class ChatPanel {
	div: HTMLElement;
	game: Game;
	input: HTMLInputElement;

	constructor(parent: HTMLElement, game: Game) {
		parent.appendChild((this.div = Div({ class: styles.chatPanel })));
		this.game = game;
		this.input = Div({
			tagname: "input",
			type: "text",
		}) as HTMLInputElement;
		this.div.appendChild(this.input);
	}

	show() {
		this.input.value = "";
		this.div.classList.add(styles.show);
		this.input.focus();
	}

	hide() {
		this.div.classList.remove(styles.show);
		this.game.ui.uiWrapper.focus();
	}

	visible() {
		return this.div.classList.contains(styles.show);
	}
}
