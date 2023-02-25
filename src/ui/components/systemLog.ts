/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../../game';
import styles from './systemLog.module.css';

const greetings = [
    'Welcome to WolkenWelten, you can use WASD+Mouse or a GamePad to move around',
    'To open your Inventory/Menu press the E key',
    'You can use weapons/items with your left mouse button or right shoulder button',
    'The right mouse button/eft shoulder button uses the selected skill/spell.',
];

export class SystemLog {
    div: HTMLElement;
    game: Game;

    constructor(parent: HTMLElement, game: Game) {
        this.game = game;

        const div = document.createElement('div');
        this.div = div;
        div.classList.add(styles.systemLog);

        parent.appendChild(div);
        const that = this;
        for (let i = 0; i < greetings.length; i++) {
            const g = greetings[i];
            const delay = i * 3000;
            setTimeout(() => {
                that.addEntry(g);
            }, delay);
        }
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
