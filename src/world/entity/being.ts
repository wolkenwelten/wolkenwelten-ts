/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Entity } from './entity';
import { World } from '../world';
import { registerClass } from '../../class';

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
}
registerClass(Being);
