/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Being } from '../entity/being';

export abstract class StatusEffect {
    id = 'Effect';
    destroyed = false;
    ticks = 0;
    ttl = 800;

    destroy() {
        this.destroyed = true;
    }

    abstract update(e: Being): void;
}
