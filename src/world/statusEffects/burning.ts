/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Being } from '../entity/being';
import { Fire } from '../fireSystem';
import { StatusEffect } from './statusEffect';

export class BurningEffect extends StatusEffect {
    id = 'Burning';
    lastDamageDealt = 0;

    update(e: Being): void {
        this.ticks++;
        if (this.ticks > this.lastDamageDealt + 40) {
            e.damage(1);
            this.lastDamageDealt += 40;
        }
        Fire.addParticle(e.world, e.x - 0.5, e.y, e.z - 0.5, 4096);

        const wet = e.effects.get('Wet');
        if (wet) {
            wet.ttl -= 5;
        }

        if (this.ticks > this.ttl) {
            this.destroy();
        }
    }
}
