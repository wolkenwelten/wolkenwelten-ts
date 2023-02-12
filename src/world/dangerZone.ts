import { coordinateToWorldKey, World } from './world';

export interface DangerZoneEntry {
    x: number;
    y: number;
    z: number;

    w: number;
    h: number;
    d: number;
}

export const coordinateToKey = (x: number, y: number, z: number) =>
    Math.floor(x) + Math.floor(y) * 0x100000 + Math.floor(z) * 0x100000000000;

export class DangerZone {
    world: World;
    entries: DangerZoneEntry[] = [];
    blocksVisited: Set<number> = new Set();

    constructor(world: World) {
        this.world = world;
    }

    add(x: number, y: number, z: number, w: number, h: number, d: number) {
        this.entries.push({ x, y, z, w, h, d });
    }

    maybeFlow(
        fromX: number,
        fromY: number,
        fromZ: number,
        toX: number,
        toY: number,
        toZ: number
    ): boolean {
        const b = this.world.getBlock(fromX, fromY, fromZ) || 0;
        const bt = this.world.blocks[b];
        if (bt.liquid) {
            this.world.setBlock(toX, toY, toZ, b);
            this.add(toX - 1, toY - 1, toZ - 1, 3, 3, 3);
            return true;
        } else {
            return false;
        }
    }

    visit(x: number, y: number, z: number) {
        const b = this.world.getBlock(x, y, z);
        if (b === 0) {
            return (
                this.maybeFlow(x, y + 1, z, x, y, z) ||
                this.maybeFlow(x, y, z - 1, x, y, z) ||
                this.maybeFlow(x, y, z + 1, x, y, z) ||
                this.maybeFlow(x - 1, y, z, x, y, z) ||
                this.maybeFlow(x + 1, y, z, x, y, z)
            );
        }
        return false;
    }

    update() {
        if (this.entries.length === 0) {
            return;
        }
        this.blocksVisited.clear();
        const entries = this.entries;
        this.entries = [];
        for (const entry of entries) {
            for (let x = 0; x < entry.w; x++) {
                for (let y = 0; y < entry.h; y++) {
                    for (let z = 0; z < entry.d; z++) {
                        const cx = x + entry.x;
                        const cy = y + entry.y;
                        const cz = z + entry.z;
                        const key = coordinateToKey(cx, cy, cz);
                        if (!this.blocksVisited.has(key)) {
                            this.blocksVisited.add(key);
                            this.visit(cx, cy, cz);
                        }
                    }
                }
            }
        }
    }
}
