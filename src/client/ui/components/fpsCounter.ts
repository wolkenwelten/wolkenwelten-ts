/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../../game";
import { Div } from "../utils";
import styles from "./fpsCounter.module.css";

export class FpsCounter {
	div: HTMLElement;

	constructor(parent: HTMLElement, game: Game) {
		const div = Div({ class: styles.fps });
		setInterval(() => {
			div.innerText = `FPS: ${game.render.fps}`;
		}, 1000);
		parent.appendChild((this.div = div));
	}
}
