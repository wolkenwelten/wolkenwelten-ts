/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './xpView.module.css';
import { Game } from '../../game';
import { Div } from '../utils';

export class XpView {
    game: Game;
    div: HTMLElement;
    bar: HTMLElement;

    lastXpPercentage = -1;

    constructor(parent: HTMLElement, game: Game) {
        this.game = game;
        parent.appendChild(
            (this.div = Div({
                class: styles.xpView,
                children: [(this.bar = Div({ class: styles.bar }))],
            }))
        );
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
