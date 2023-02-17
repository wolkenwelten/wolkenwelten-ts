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

    lastLevel = -1;
    lastXpPercentage = -1;

    constructor(parent: HTMLElement, game: Game) {
        const div = document.createElement('div');
        this.div = div;
        div.classList.add(styles.wrap);

        this.lvl = document.createElement('div');
        this.lvl.classList.add(styles.level);
        div.append(this.lvl);

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
        if (char.level !== this.lastLevel) {
            this.lvl.innerText = String(char.level + 1);
            this.lastLevel = char.level;
        }
        const xpPercentage = (char.xpPercentageTillNextLevel() * 100) | 0;
        if (this.lastXpPercentage !== xpPercentage) {
            this.bar.style.height = `${xpPercentage}%`;
            this.lastXpPercentage = xpPercentage;
        }
    }
}
