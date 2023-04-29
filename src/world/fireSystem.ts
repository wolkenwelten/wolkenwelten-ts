/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */

import type { World } from './world';

export const coordinateToKey = (x: number, y: number, z: number) =>
    (Math.floor(x) & 0xffff) +
    (Math.floor(y) & 0xffff) * 0x10000 +
    (Math.floor(z) & 0xffff) * 0x100000000;

export interface FireQueue {
    x: number;
    y: number;
    z: number;
    strength: number;
}

const MAX_FIRES = 4096;
const FIRE_MAX_STRENGTH = 8192;

export class FireSystem {
    fires: Map<number, Fire> = new Map();
    fireQueue: FireQueue[] = [];
    world: World;

    constructor(world: World) {
        this.world = world;
    }

    add(x: number, y: number, z: number, strength: number) {
        const key = coordinateToKey(x, y, z);
        const fire = this.fires.get(key);
        if (fire) {
            fire.strength = Math.min(
                FIRE_MAX_STRENGTH,
                fire.strength + strength
            );
        } else {
            const fire = new Fire(x, y, z, strength);
            this.fires.set(key, fire);
        }
        if (this.fires.size > MAX_FIRES) {
            this.fires.delete(this.fires.keys().next().value);
        }
    }

    get(x: number, y: number, z: number): number {
        const key = coordinateToKey(x, y, z);
        return this.fires.get(key)?.strength || 0;
    }

    queue(x: number, y: number, z: number, strength: number) {
        this.fireQueue.push({ x, y, z, strength });
    }

    update() {
        for (const fire of this.fires.values()) {
            fire.update(this);
        }
        for (let i = 0; i < this.fireQueue.length; i++) {
            const e = this.fireQueue[i];
            const b = this.world.getBlock(e.x, e.y, e.z);
            if (b) {
                const bt = this.world.blocks[b];
                if (Math.random() <= bt.fireSpreadToChance) {
                    this.add(e.x, e.y, e.z, e.strength);
                }
            } else {
                this.add(e.x, e.y, e.z, e.strength);
            }
        }
        this.fireQueue.length = 0;
    }
}

export class Fire {
    x: number;
    y: number;
    z: number;
    strength: number;
    spreadDirection: number;
    damageDealt = 0;
    ticksTillNextSpread = 4;

    constructor(x: number, y: number, z: number, strength: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.strength = strength;
        this.spreadDirection = Math.floor(Math.random() * 6);
    }

    update(system: FireSystem) {
        this.damageDealt += 64;
        const block = system.world.getBlock(this.x, this.y, this.z);
        if (block) {
            const bt = system.world.blocks[block];
            this.strength += bt.fireDamage;
            if (this.damageDealt > bt.fireHealth) {
                bt.burnHandler(system.world, this.x, this.y, this.z);
                this.damageDealt -= bt.fireHealth;
            }
        } else {
            this.ticksTillNextSpread -= 8;
            this.strength -= 64;
        }

        this.strength -= 64;
        if (this.strength <= 0) {
            system.fires.delete(coordinateToKey(this.x, this.y, this.z));
            return;
        }
        if (--this.ticksTillNextSpread <= 0) {
            this.ticksTillNextSpread = 48;
            this.spreadDirection = (this.spreadDirection + 1) % 6;
            switch (this.spreadDirection) {
                case 0:
                    system.queue(this.x + 1, this.y, this.z, 32);
                    break;
                case 1:
                    system.queue(this.x - 1, this.y, this.z, 32);
                    break;
                case 2:
                    system.queue(this.x, this.y + 1, this.z, 32);
                    break;
                case 3:
                    system.queue(this.x, this.y - 1, this.z, 32);
                    break;
                case 4:
                    system.queue(this.x, this.y, this.z + 1, 32);
                    break;
                case 5:
                    system.queue(this.x, this.y, this.z - 1, 32);
                    break;
                default:
                    break;
            }
        }
        Fire.addParticle(system.world, this.x, this.y, this.z, this.strength);
    }

    static addParticle(
        world: World,
        x: number,
        y: number,
        z: number,
        strength: number
    ) {
        const ox = Math.random();
        const oy = Math.random();
        const oz = Math.random();
        const r = 0xf0 | (Math.random() * 16);
        const g = 0x20 | (Math.random() * 16);
        const b = 0x00;
        const a = 0xff;
        const color = r | (g << 8) | (b << 16) | (a << 24);
        world.game.render.particle.add(
            x + ox,
            y + oy,
            z + oz,
            Math.max(64, Math.min(384, strength / 8)),
            color,
            (Math.random() - 0.5) * 0.02,
            0.05,
            (Math.random() - 0.5) * 0.02,
            -3.5,
            0,
            0,
            0,
            0
        );
    }
}
