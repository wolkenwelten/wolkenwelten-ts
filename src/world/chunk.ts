import { Entity } from './entity';
import { lightGenSimple } from './chunk/lightGen';
import { World } from '../world';

const coordinateToOffset = (x: number, y: number, z: number) =>
    (x & 0x1f) | ((y & 0x1f) << 5) | ((z & 0x1f) << 10);

export class Chunk {
    blocks: Uint8Array;
    lastUpdated: number;
    simpleLight: Uint8Array;
    simpleLightLastUpdated = 0;
    x: number;
    y: number;
    z: number;
    world: World;

    constructor(world: World, x: number, y: number, z: number) {
        this.blocks = new Uint8Array(32 * 32 * 32);
        this.simpleLight = new Uint8Array(32 * 32 * 32);
        this.x = x;
        this.y = y;
        this.z = z;
        this.world = world;
        this.lastUpdated = world.game.ticks;
        const seed = x ^ y ^ z;
        if (seed & 32) {
            return;
        }
        if (seed & 64) {
            this.setSphere(16, 16, 16, 8, 2);
            this.setSphere(16, 15, 16, 8, 1);
            this.setSphere(16, 12, 16, 7, 3);
        } else {
            if (seed & 128) {
                this.setBox(4, 4, 4, 24, 24, 24, 9);
            } else {
                this.setBox(8, 8, 8, 16, 16, 16, 13);
            }
        }
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

    setBlock(x: number, y: number, z: number, block: number) {
        const i = coordinateToOffset(x, y, z);
        this.blocks[i] = block;
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
        for (let x = cx; x < cx + w; x++) {
            for (let y = cy; y < cy + h; y++) {
                for (let z = cz; z < cz + d; z++) {
                    if (x < 0 || x >= 32) {
                        continue;
                    }
                    if (y < 0 || y >= 32) {
                        continue;
                    }
                    if (z < 0 || z >= 32) {
                        continue;
                    }
                    this.blocks[coordinateToOffset(x, y, z)] = block;
                }
            }
        }
    }

    setSphere(cx: number, cy: number, cz: number, r: number, block: number) {
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

    gc(maxDistance: number, entity: Entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const dz = this.z - entity.z;
        const d = dx * dx + dy * dy + dz * dz;
        return d > maxDistance;
    }
}
