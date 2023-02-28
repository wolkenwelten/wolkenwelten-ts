/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../../game';
import styles from './introWindow.module.css';

export class IntroWindow {
    div: HTMLElement;
    game: Game;

    constructor(parent: HTMLElement, game: Game) {
        this.game = game;
        this.div = document.createElement('div');
        this.div.classList.add(styles.introWindow);

        this.div.innerHTML = `<h3>WolkenWelten</h3>
        <p>You have washed upon the cursed shores of the Island of Dreams.<br/><br/>
        If you can survive the ordeals that await, you may be granted an immense power.</p>
        <table>
        <tr><th><h3>Controls</h3></th><th>Keyboard</th><th>Gamepad</th></tr>
        <tr><th>Movement</th><td>WASD</td><td>Left analog stick</td></tr>
        <tr><th>Look around</th><td>Mouse</td><td>Right analog stick</td></tr>
        <tr><th>Jump</th><td>Space</td><td>A</td></tr>
        <tr><th>Open inventory</th><td>E</td><td>Not implemented yet</tr>
        <tr><th>Attack/mine/use item</th><td>Left mouse button</td><td>Right trigger</td></tr>
        <tr><th>Use skill/spell</th><td>Right mouse button</td><td>Left trigger</td></tr>
        <tr><th>Drop item</th><td>Q</td><td>Y</td></tr>
        <tr><th>Sneak</th><td>Shift</td><td>Right shoulder button</td></tr>

        </table>
        `

        const startButton = document.createElement('div');
        startButton.classList.add(styles.startButton);
        startButton.innerText = "Start";
        startButton.onclick = () => {
            game.running = true;
            game.input.requestFullscreenAndPointerLock();
        };
        this.div.append(startButton);
        parent.append(this.div);

        if(game.options.skipMenu){
            game.running = true;
        }
        startButton.focus();
    }
}
