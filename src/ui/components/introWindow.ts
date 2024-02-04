/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from '../../game';
import { Div } from '../utils';
import styles from './introWindow.module.css';

export class IntroWindow {
	div: HTMLElement;
	game: Game;

	constructor(parent: HTMLElement, game: Game) {
		this.game = game;
		this.div = Div({
			class: styles.introWindow,
			html: `<h3>WolkenWelten</h3>
        <p>Single-player tech demo, will become more fun once multiple players can fight in a battle royale style.</p>
        <table>
        <tr><th><h3>Controls</h3></th><th>Keyboard</th><th>Gamepad</th></tr>
        <tr><th>Movement</th><td>WASD</td><td>Left analog stick</td></tr>
        <tr><th>Look around</th><td>Mouse</td><td>Right analog stick</td></tr>
        <tr><th>Jump</th><td>Space</td><td>A</td></tr>
        <tr><th>Attack</th><td>Left mouse button</td><td>Right trigger</td></tr>
        <tr><th>Use skill</th><td>0-9</td><td>Not implemented yet</td></tr>
        </table>`,
		});

		const startButton = Div({
			class: styles.startButton,
			text: 'Start',
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
