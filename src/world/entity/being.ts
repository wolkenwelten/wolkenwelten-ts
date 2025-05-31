/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { World } from "../world";
import { Entity } from "./entity";

export abstract class Being extends Entity {
	T = "Being";

	level = 0;
	isDead = false;
	health = 12;
	maxHealth = 12;

	serialize() {
		return {
			...super.serialize(),
			level: this.level,
			isDead: this.isDead,
			health: this.health,
			maxHealth: this.maxHealth,
		};
	}

	deserialize(data: any) {
		super.deserialize(data);
		this.level = data.level;
		this.isDead = data.isDead;
		this.health = data.health;
		this.maxHealth = data.maxHealth;
	}

	constructor(world: World) {
		super(world);
	}

	damage(rawAmount: number): void {
		this.health = Math.max(
			0,
			Math.min(this.health - rawAmount, this.maxHealth),
		);
		if (this.health <= 0) {
			this.die();
		}
	}

	die() {
		this.isDead = true;
		this.onDeath();
	}

	heal(rawAmount: number): void {
		this.damage(-rawAmount);
	}

	onDeath() {}
	onAttack(perpetrator: Entity): void {}

	update(): void {
		super.update();
		this.beRepelledByEntities();
	}
}
