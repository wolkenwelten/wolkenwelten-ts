/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './healthOrb.module.css';
import { Game } from '../../game';

export class HealthOrb {
    div: HTMLElement;
    health: HTMLElement;
    healthOverlay: HTMLElement;
    healthWrap: HTMLElement;
    game: Game;
    lastHealth = -9;

    constructor(parent: HTMLElement, game: Game) {
        this.game = game;

        this.div = document.createElement('div');
        this.div.classList.add(styles.healthWrap);

        this.healthWrap = document.createElement('div');
        this.healthWrap.classList.add(styles.healthOrbWrap);
        this.div.append(this.healthWrap);

        this.healthOverlay = document.createElement('div');
        this.healthOverlay.classList.add(styles.healthOrbOverlay);
        this.healthWrap.append(this.healthOverlay);

        this.health = document.createElement('div');
        this.health.classList.add(styles.healthOrb);
        this.healthWrap.append(this.health);

        parent.appendChild(this.div);
        this.update();
    }

    update() {
        const percentage = Math.floor(
            (this.game.player.health / this.game.player.maxHealth) * 100
        );
        if (this.lastHealth !== percentage) {
            this.healthOverlay.style.height = `${100 - percentage}%`;
            this.lastHealth = percentage;
        }
    }
}
