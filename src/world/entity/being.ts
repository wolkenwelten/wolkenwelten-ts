/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { World } from '../world';
import { Entity } from './entity';
import { StatusEffect } from '../statusEffects/statusEffect';
import { BurningEffect } from '../statusEffects/burning';
import { WetEffect } from '../statusEffects/wet';

export abstract class Being extends Entity {
    level = 0;
    isDead = false;
    health = 12;
    maxHealth = 12;
    effects: Map<string, StatusEffect> = new Map();

    constructor(world: World, x: number, y: number, z: number) {
        super(world);
        this.x = x;
        this.y = y;
        this.z = z;
    }

    checkForFire() {
        const ix = Math.floor(this.x);
        const iy = Math.floor(this.y);
        const iz = Math.floor(this.z);
        let f = 0;
        f += this.world.fire.get(ix, iy, iz);
        f += this.world.fire.get(ix, iy - 1, iz);
        f += this.world.fire.get(ix, iy + 1, iz);
        f += this.world.fire.get(ix - 1, iy, iz);
        f += this.world.fire.get(ix + 1, iy, iz);
        f += this.world.fire.get(ix, iy, iz - 1);
        f += this.world.fire.get(ix, iy, iz + 1);

        if (f > 128) {
            const e = this.effects.get('Burning');
            if (!e) {
                const e = new BurningEffect();
                this.effects.set(e.id, e);
            } else {
                e.ttl += 10;
            }
        }
    }

    checkForWater() {
        if (this.world.isLiquid(this.x, this.y, this.z)) {
            const e = this.effects.get('Wet');
            if (!e) {
                const e = new WetEffect();
                this.effects.set(e.id, e);
            } else {
                e.ttl += 10;
            }
        }
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

    updateEffects() {
        for (const e of this.effects.values()) {
            e.update(this);
            if (e.destroyed) {
                this.effects.delete(e.id);
            }
        }
    }

    update(): void {
        this.checkForFire();
        this.checkForWater();
        this.beRepelledByEntities();
        this.updateEffects();
    }
}
