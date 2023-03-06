/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from '../../game';
import { Div } from '../utils';
import styles from './healthOrb.module.css';

export class HealthOrb {
    game: Game;
    div: HTMLElement;
    healthOverlay: HTMLElement;
    manaOverlay: HTMLElement;

    lastHealth = -9;
    lastMana = -9;
    lastSkillIcon = '';

    constructor(parent: HTMLElement, game: Game) {
        this.game = game;
        this.div = Div({
            class: styles.healthWrap,
            children: [
                Div({
                    class: styles.healthOrbWrap,
                    children: [
                        (this.healthOverlay = Div({
                            class: styles.healthOrbOverlay,
                        })),
                        Div({ class: styles.healthOrb }),
                    ],
                }),
                Div({
                    class: styles.manaOrbWrap,
                    children: [
                        (this.manaOverlay = Div({
                            class: styles.manaOrbOverlay,
                        })),
                        Div({ class: styles.manaOrb }),
                    ],
                }),
            ],
        });

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
