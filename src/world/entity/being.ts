/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Base class representing any living entity that possesses hit points, can take damage and can die.
 *
 * Intended usage:
 * - Derive every creature, NPC, monster or player character that needs health management from this class.
 * - Override the `update`, `onDeath`, and `onAttack` hooks to provide custom behaviour.
 *
 * Foot-guns / Pitfalls:
 * 1. Healing is implemented by calling `damage()` with a negative value – handy, but easy to misuse.
 *    Prefer the dedicated `heal()` helper unless you have a compelling reason not to.
 * 2. If you override `serialize` or `deserialize` you must call `super.serialize()` / `super.deserialize()`
 *    or state synchronisation will silently break.
 * 3. `update()` is executed only on the owner ( `ownerID === world.game.networkID` ).
 *    Forgetting this will lead to the entity appearing frozen for other clients.
 * 4. Both `onDeath()` and `onAttack()` are empty hooks – bumping into them without overriding
 *    means nothing will happen.
 *
 * Lifecycle:
 * 1. `damage()` is the single source of truth for modifying HP. When HP reaches 0, `die()` is invoked automatically.
 * 2. `die()` sets `isDead` and then calls `onDeath()` exactly once.
 */

import type { World } from "../world";
import { Entity } from "./entity";

export abstract class Being extends Entity {
	T = "Being";

	level = 0;
	isDead = false;
	health = 12;
	maxHealth = 12;

	/**
	 * Serialises the Being's state into a plain object suitable for persistence or network transfer.
	 * Make sure to include any additional properties you introduce in subclasses to keep save-files compatible.
	 */
	serialize() {
		return {
			...super.serialize(),
			level: this.level,
			isDead: this.isDead,
			health: this.health,
			maxHealth: this.maxHealth,
		};
	}

	/**
	 * Restores a Being's state from the data produced by `serialize()`.
	 * The structure must remain in sync with `serialize()` to avoid subtle bugs.
	 */
	deserialize(data: any) {
		super.deserialize(data);
		this.level = data.level;
		this.isDead = data.isDead;
		this.health = data.health;
		this.maxHealth = data.maxHealth;
	}

	/**
	 * Creates a new Being instance.
	 * @param world Reference to the game world instance.
	 * @param id Optional unique network ID. Will be assigned automatically if omitted.
	 */
	constructor(world: World, id?: number) {
		super(world, id);
	}

	/**
	 * Applies `rawAmount` points of damage. Negative values *heal* instead, see `heal()`.
	 * When health drops to 0, `die()` is triggered.
	 *
	 * @param rawAmount Positive number for damage, negative number for healing.
	 */
	damage(rawAmount: number): void {
		this.health = Math.max(
			0,
			Math.min(this.health - rawAmount, this.maxHealth),
		);
		if (this.health <= 0) {
			this.die();
		}
	}

	/**
	 * Marks the Being as dead and fires the `onDeath()` hook.
	 * In most cases you should override `onDeath()` instead of this method.
	 */
	die() {
		this.isDead = true;
		this.onDeath();
	}

	/**
	 * Convenience wrapper around `damage()` that enforces positive semantics: pass the *amount to heal*.
	 */
	heal(rawAmount: number): void {
		this.damage(-rawAmount);
	}

	/**
	 * Override in subclasses to implement death effects (loot drops, animations, sound, etc.).
	 */
	onDeath() {}

	/**
	 * Called whenever another entity attacks this Being. Override to add retaliation, aggro, etc.
	 */
	onAttack(perpetrator: Entity): void {}

	/**
	 * Per-tick update executed **only** on the owning client / server. Skips execution elsewhere to prevent desync.
	 * Make sure any authority-side logic that must run everywhere gets replicated via the network layer.
	 */
	update(): void {
		if (this.ownerID !== this.world.game.networkID) {
			return;
		}
		super.update();
		this.beRepelledByEntities();
	}
}
