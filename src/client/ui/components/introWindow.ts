/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { ClientGame } from "../../clientGame";
import { Div } from "../utils";
import styles from "./introWindow.module.css";

export class IntroWindow {
	div: HTMLElement;
	game: ClientGame;

	constructor(parent: HTMLElement, game: ClientGame) {
		this.game = game;
		this.div = Div({
			class: styles.introWindow,
			html: `<h3>WolkenWelten</h3>
        <p>Single-player tech demo, will become more fun once multiple players can fight in a battle royale style.</p>
        <table>
        <tr><th><h3>Controls</h3></th><th>Keyboard</th><th>Gamepad</th><th>Touch</th></tr>
        <tr><th>Movement</th><td>WASD</td><td>Left analog stick</td><td>Left joystick</td></tr>
        <tr><th>Look around</th><td>Mouse</td><td>Right analog stick</td><td>Right joystick</td></tr>
        <tr><th>Jump</th><td>Space</td><td>A</td><td>Jump button</td></tr>
        <tr><th>Sprint</th><td>Shift</td><td>B</td><td>Sprint button</td></tr>
        <tr><th>Attack</th><td>Left mouse button</td><td>Right trigger</td><td>Primary button</td></tr>
        <tr><th>Use skill</th><td>0-9</td><td>Not implemented yet</td><td>Hotbar buttons</td></tr>
        </table>`,
		});

		const startButton = Div({
			class: styles.startButton,
			text: "Start",
			onClick: () => {
				game.running = true;
				game.input.requestFullscreenAndPointerLock();
			},
		});
		this.div.append(startButton);

		parent.append(this.div);
		if (game.options.skipMenu) {
			game.running = true;
		}
		startButton.focus();
	}
}
