/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './healthOrb.module.css';
import { Game } from '../../game';
import { Skill } from '../../world/skill/skill';

export class HealthOrb {
    div: HTMLElement;
    game: Game;

    health: HTMLElement;
    healthOverlay: HTMLElement;
    healthWrap: HTMLElement;

    mana: HTMLElement;
    manaOverlay: HTMLElement;
    manaWrap: HTMLElement;
    manaIcon: HTMLImageElement;

    lastHealth = -9;
    lastMana = -9;
    lastSkillIcon = '';

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

        this.manaIcon = document.createElement('img');
        this.manaIcon.classList.add(styles.manaIcon);
        this.manaIcon.style.display = 'none';
        this.manaWrap.append(this.manaIcon);

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

        const curSkillIcon = this.game.player.selectedSkill?.skill.icon || '';
        if (curSkillIcon !== this.lastSkillIcon) {
            if (curSkillIcon) {
                this.manaIcon.src = curSkillIcon;
                this.manaIcon.style.display = 'block';
            } else {
                this.manaIcon.style.display = 'none';
            }
            this.lastSkillIcon = curSkillIcon;
        }
    }
}
