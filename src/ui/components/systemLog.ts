/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../../game';
import styles from './systemLog.module.css';

export class SystemLog {
    div: HTMLElement;
    game: Game;

    constructor(parent: HTMLElement, game: Game) {
        this.game = game;

        const div = document.createElement('div');
        this.div = div;
        div.classList.add(styles.systemLog);

        parent.appendChild(div);
        this.addEntry(
            'Welcome to WolkenWelten, you can use WASD+Mouse or a GamePad to move around'
        );
        this.addEntry('You can use E to open the Inventory/Menu');
    }

    addEntry(msg: string) {
        const entry = document.createElement('div');
        entry.innerText = msg;
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
