/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './xpView.module.css';
import { Game } from '../../game';
import { Character } from '../../world/entity/character';

export class XpView {
    game: Game;
    div: HTMLElement;
    bar: HTMLElement;

    lastXpPercentage = -1;

    constructor(parent: HTMLElement, game: Game) {
        this.game = game;

        const div = document.createElement('div');
        this.div = div;
        div.classList.add(styles.xpView);

        this.bar = document.createElement('div');
        this.bar.classList.add(styles.bar);
        div.append(this.bar);

        parent.appendChild(div);
        this.update();
    }

    update() {
        const char = this.game.player;
        const xpPercentage =
            Math.floor(char.xpPercentageTillNextLevel() * 1000) / 10;
        if (this.lastXpPercentage !== xpPercentage) {
            this.bar.style.width = `${xpPercentage}%`;
            this.lastXpPercentage = xpPercentage;
        }
    }
}
