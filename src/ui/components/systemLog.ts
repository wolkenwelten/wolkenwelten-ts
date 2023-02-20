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
    }

    addEntry(msg: string) {
        const entry = document.createElement('div');
        entry.innerText = msg;
        this.div.prepend(entry);
        entry.getBoundingClientRect();
        entry.classList.add(styles.visible);

        const that = this;
        setTimeout(() => {
            entry.classList.remove(styles.visible);
        }, 30000);
        setTimeout(() => {
            entry.remove();
        }, 32000);
    }

    update() {}
}
