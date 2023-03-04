/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { World } from '../world';
import { Entity } from './entity';

export class Being extends Entity {
    level = 0;
    isDead = false;
    health = 12;
    maxHealth = 12;

    constructor(world: World, x: number, y: number, z: number) {
        super(world);
        this.x = x;
        this.y = y;
        this.z = z;
    }

    damage(rawAmount: number): void {
        this.health = Math.max(
            0,
            Math.min(this.health - rawAmount, this.maxHealth)
        );
        if (this.health <= 0) {
            this.isDead = true;
            this.onDeath();
        }
    }

    heal(rawAmount: number): void {
        this.damage(-rawAmount);
    }

    onDeath() {}
    onAttack(perpetrator: Entity): void {}
}
