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

    mana: HTMLElement;
    manaOverlay: HTMLElement;
    manaWrap: HTMLElement;

    game: Game;
    lastHealth = -9;
    lastMana = -9;

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

        this.manaWrap = document.createElement('div');
        this.manaWrap.classList.add(styles.manaOrbWrap);
        this.div.append(this.manaWrap);

        this.manaOverlay = document.createElement('div');
        this.manaOverlay.classList.add(styles.manaOrbOverlay);
        this.manaWrap.append(this.manaOverlay);

        this.mana = document.createElement('div');
        this.mana.classList.add(styles.manaOrb);
        this.manaWrap.append(this.mana);

        parent.appendChild(this.div);
        this.update();
    }

    update() {
        const healthPercentage = Math.floor(
            (this.game.player.health / this.game.player.maxHealth) * 100
        );
        if (this.lastHealth !== healthPercentage) {
            this.healthOverlay.style.height = `${100 - healthPercentage}%`;
            this.lastHealth = healthPercentage;
        }

        const manaPercentage = Math.floor(
            (this.game.player.mana / this.game.player.maxMana) * 100
        );
        if (this.lastMana !== manaPercentage) {
            this.manaOverlay.style.height = `${100 - manaPercentage}%`;
            this.lastMana = manaPercentage;
        }
    }
}
