/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Entity } from '../entity/entity';
import { lightGenSimple } from './lightGen';
import { StaticObject } from '../staticObjects/staticObject';
import { World } from '../world';
import { worldgenSurface } from '../worldgen/surface';
import { worldgenSky } from '../worldgen/sky';
import { worldgenUnderground } from '../worldgen/underground';
import profiler from '../../profiler';

const coordinateToOffset = (x: number, y: number, z: number) =>
    (Math.floor(x) & 0x1f) |
    ((Math.floor(y) & 0x1f) * 32) |
    ((Math.floor(z) & 0x1f) * 32 * 32);

export class Chunk {
    blocks: Uint8Array;
    lastUpdated: number;
    staticLastUpdated: number;
    simpleLight: Uint8Array;
    simpleLightLastUpdated = 0;
    x: number;
    y: number;
    z: number;
    static: Set<StaticObject> = new Set();
    world: World;

    constructor(world: World, x: number, y: number, z: number) {
        this.blocks = new Uint8Array(32 * 32 * 32);
        this.simpleLight = new Uint8Array(32 * 32 * 32);
        this.x = x;
        this.y = y;
        this.z = z;
        this.world = world;
        this.staticLastUpdated = this.lastUpdated = world.game.ticks;
        this.worldgen();
    }

    worldgen() {
        const start = performance.now();
        if (this.y < -512) {
            worldgenUnderground(this);
        } else if (this.y < 512) {
            worldgenSurface(this);
        } else {
            worldgenSky(this);
        }
        const end = performance.now();
        profiler.add('worldgen', start, end);
    }

    updateSimpleLight() {
        if (this.simpleLightLastUpdated >= this.lastUpdated) {
            return;
        }
        lightGenSimple(this.simpleLight, this.blocks);
        this.simpleLightLastUpdated = this.lastUpdated;
    }

    getBlock(x: number, y: number, z: number): number {
        const i = coordinateToOffset(x, y, z);
        return this.blocks[i];
    }

    setBlockUnsafe(x: number, y: number, z: number, block: number) {
        const i = coordinateToOffset(x, y, z);
        this.blocks[i] = block;
    }

    setBlock(x: number, y: number, z: number, block: number) {
        this.setBlockUnsafe(x, y, z, block);
        this.world.invalidatePosition(x, y, z);
    }

    setBoxUnsafe(
        cx: number,
        cy: number,
        cz: number,
        w: number,
        h: number,
        d: number,
        block: number
    ) {
        for (let x = cx; x < cx + w; x++) {
            const xOff = Math.floor(x) & 0x1f;
            if (x < 0 || x >= 32) {
                continue;
            }
            for (let y = cy; y < cy + h; y++) {
                const yOff = (Math.floor(y) & 0x1f) * 32;
                if (y < 0 || y >= 32) {
                    continue;
                }
                for (let z = cz; z < cz + d; z++) {
                    if (z < 0 || z >= 32) {
                        continue;
                    }
                    const zOff = (Math.floor(z) & 0x1f) * (32 * 32);
                    const off = xOff | yOff | zOff;
                    this.blocks[off] = block;
                }
            }
        }
    }

    setBox(
        cx: number,
        cy: number,
        cz: number,
        w: number,
        h: number,
        d: number,
        block: number
    ) {
        this.setBoxUnsafe(cx, cy, cz, w, h, d, block);
        this.world.invalidatePosition(cx, cy, cz);
        this.world.invalidatePosition(cx, cy, cz + d);
        this.world.invalidatePosition(cx, cy + h, cz);
        this.world.invalidatePosition(cx, cy + h, cz + 1);
        this.world.invalidatePosition(cx + w, cy, cz);
        this.world.invalidatePosition(cx + w, cy, cz + d);
        this.world.invalidatePosition(cx + w, cy + h, cz);
        this.world.invalidatePosition(cx + w, cy + h, cz + 1);
    }

    setSphereUnsafe(
        cx: number,
        cy: number,
        cz: number,
        r: number,
        block: number
    ) {
        const rrr = r * r;
        for (let x = -r; x <= r; x++) {
            for (let y = -r; y <= r; y++) {
                for (let z = -r; z <= r; z++) {
                    const ddd = x * x + y * y + z * z;
                    if (rrr > ddd) {
                        const tx = x + cx;
                        const ty = y + cy;
                        const tz = z + cz;
                        if (tx < 0 || tx >= 32) {
                            continue;
                        }
                        if (ty < 0 || ty >= 32) {
                            continue;
                        }
                        if (tz < 0 || tz >= 32) {
                            continue;
                        }
                        this.blocks[coordinateToOffset(tx, ty, tz)] = block;
                    }
                }
            }
        }
    }

    setSphere(cx: number, cy: number, cz: number, r: number, block: number) {
        this.setSphereUnsafe(cx, cy, cz, r, block);
        this.world.invalidatePosition(cx - r, cy, cz);
        this.world.invalidatePosition(cx + r, cy, cz);
        this.world.invalidatePosition(cx, cy - r, cz);
        this.world.invalidatePosition(cx, cy + r, cz);
        this.world.invalidatePosition(cx, cy, cz - r);
        this.world.invalidatePosition(cx, cy, cz + r);
    }

    gc(maxDistance: number, entity: Entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const dz = this.z - entity.z;
        const d = dx * dx + dy * dy + dz * dz;
        return d > maxDistance;
    }

    invalidate() {
        this.lastUpdated = this.world.game.ticks;
    }

    staticAdd(obj: StaticObject) {
        this.staticLastUpdated = this.world.game.ticks;
        this.static.add(obj);
    }

    staticDelete(obj: StaticObject) {
        this.staticLastUpdated = this.world.game.ticks;
        this.static.delete(obj);
    }
}
