/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from "./healthBar.module.css";
import type { Game } from "../../../game";
import { Heart } from "./heart";
import { isClient, mockElement } from "../../../util/compat";

export class HealthBar {
	div: HTMLElement;
	hearts: Heart[] = [];
	maxHealth = -999;

	constructor(parent: HTMLElement, game: Game) {
		const div = isClient() ? document.createElement("div") : mockElement();
		this.div = div;
		div.classList.add(styles.bar);
		const player = game.player;
		parent.appendChild(div);
		this.update(player.health, player.maxHealth);
	}

	update(health: number, maxHealth: number) {
		if (this.maxHealth !== maxHealth) {
			const heartCount = Math.ceil(maxHealth / 4);
			for (let i = this.hearts.length; i < heartCount; i++) {
				const hp = this.hearts.length * 4;
				this.hearts.push(new Heart(this.div, Math.min(4, health - hp)));
			}
			this.maxHealth = maxHealth;
		}
		for (let i = 0; i < this.hearts.length; i++) {
			const hp = health - i * 4;
			this.hearts[i].update(Math.min(4, hp), hp > 0 && hp <= 4);
		}
	}
}
