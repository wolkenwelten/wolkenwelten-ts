/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './xpView.module.css';
import { Game } from '../../game';
import { Character } from '../../world/entity/character';

export class XpView {
    div: HTMLElement;
    lvl: HTMLElement;
    bar: HTMLElement;

    lastXpPercentage = -1;

    constructor(parent: HTMLElement, game: Game) {
        const div = document.createElement('div');
        this.div = div;
        div.classList.add(styles.xpView);

        this.bar = document.createElement('div');
        this.bar.classList.add(styles.bar);
        div.append(this.bar);

        const that = this;
        const player = game.player;
        const updateThis = (e: any) => {
            that.update(player);
        };
        parent.parentElement?.addEventListener('playerXp', updateThis);
        parent.appendChild(div);
        this.update(player);
    }

    update(char: Character) {
        const xpPercentage = char.xpPercentageTillNextLevel() * 100;
        if (this.lastXpPercentage !== xpPercentage) {
            this.bar.style.width = `${xpPercentage}%`;
            this.lastXpPercentage = xpPercentage;
        }
    }
}
