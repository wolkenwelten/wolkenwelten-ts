/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/earthWall.png';
import meshUrl from '../../../assets/vox/items/stone.vox?url';
import { TriangleMesh } from '../../render/meshes/triangleMesh/triangleMesh';
import { VoxelMesh } from '../../render/meshes/voxelMesh/voxelMesh';
import { Character } from '../../world/entity/character';
import { Entity } from '../../world/entity/entity';
import { World } from '../../world/world';

import { Rune } from './rune';

export interface WallSelection {
    block: number;
    from: [number, number, number];
    to: [number, number, number];
}

export class EarthWall extends Rune {
    name = 'Earth wall';
    icon = itemIcon;
    meshUrl = meshUrl;
    range = 5;

    private lastUseFrameCount = -1;

    private getWallSelection(e: Character) {
        const ray = e.raycast(false);
        if (!ray) {
            return [];
        }
        const [x, y, z] = ray;
        const blockType = e.world.getBlock(x, y, z);
        if (blockType === undefined) {
            return [];
        }
        const dx = x + 0.5 - e.x;
        const dy = y + 0.5 - e.y;
        const dz = z + 0.5 - e.z;
        const dd = dx * dx + dy * dy + dz * dz;
        if (dd > this.range * this.range) {
            return [];
        }

        const walkDir = e.walkDirection();
        const ret: WallSelection[] = [];
        for (let ox = -1; ox <= 1; ox++) {
            const oy = 0;
            for (let oz = -1; oz <= 1; oz++) {
                const b = e.world.getBlock(x + ox, y + oy, z + oz);
                if (!b) {
                    continue;
                }
                if (this.world.blocks[b].miningCat !== 'Pickaxe') {
                    continue;
                }
                let gx = x + ox;
                let gy = y + oy;
                let gz = z + oz;
                if (Math.abs(walkDir[0]) > Math.abs(walkDir[1])) {
                    if (walkDir[0] > 0) {
                        gy += ox + 2;
                        gx = x - oy - 2;
                    } else {
                        gy += ox + 2;
                        gx = x - oy + 2;
                    }
                } else {
                    if (walkDir[1] > 0) {
                        gy += oz + 2;
                        gz = z - oy - 2;
                    } else {
                        gy += oz + 2;
                        gz = z - oy + 2;
                    }
                }
                const gb = e.world.getBlock(gx, gy, gz);
                if (gb) {
                    continue;
                }
                if (!e.world.isSolid(gx, y + oy, gz)) {
                    continue;
                }
                ret.push({
                    from: [x + ox, y + oy, z + oz],
                    to: [gx, gy, gz],
                    block: b,
                });
            }
        }
        return ret;
    }

    use(e: Character) {
        if (e.isOnCooldown()) {
            return;
        }
        const frame = e.world.game.render.frames;
        const decals = e.world.game.render.decals;
        if (this.lastUseFrameCount !== frame) {
            const selection = this.getWallSelection(e);
            if (selection.length === 0) {
                return;
            }
            for (const b of selection) {
                decals.addBlock(b.from[0], b.from[1], b.from[2], 0, 2);
                decals.addBlock(b.to[0], b.to[1], b.to[2], 1, 2);
            }
            this.lastUseFrameCount = frame;
        }
    }

    useRelease(e: Character) {
        const selection = this.getWallSelection(e);
        if (selection.length === 0) {
            return;
        }
        for (const b of selection) {
            this.world.setBlock(b.from[0], b.from[1], b.from[2], 0);
            const e = new EarthWallBlock(this.world, b.block, b.from, b.to);
            e.playSound('pock', 0.3);
        }
        e.cooldown(80);
    }
}

export class EarthWallBlock extends Entity {
    blockType: number;
    from: [number, number, number];
    to: [number, number, number];
    ticksActive = 0;

    constructor(
        world: World,
        blockType: number,
        from: [number, number, number],
        to: [number, number, number]
    ) {
        super(world);
        if (blockType === 2) {
            blockType = 1;
        }
        this.blockType = blockType;
        this.from = from;
        this.to = to;
        this.x = from[0] + 0.5;
        this.y = from[1] + 0.5;
        this.z = from[2] + 0.5;
        this.scale = 2;
        this.world.game.render.particle.fxBlockBreak(
            this.x - 0.5,
            this.y - 0.5,
            this.z - 0.5,
            this.world.blocks[this.blockType]
        );
        this.playSound('projectile', 0.2, true);
    }

    mesh(): TriangleMesh | VoxelMesh | null {
        return (
            this.world.game.render.assets.blockType[this.blockType] ||
            this.world.game.render.assets.bag
        );
    }

    update() {
        super.update();
        const t = Math.sin(++this.ticksActive * 0.02 * Math.PI);
        if (t >= 0.95) {
            this.world.setBlock(
                this.to[0],
                this.to[1],
                this.to[2],
                this.blockType
            );
            this.world.game.render.particle.fxBlockBreak(
                this.x - 0.5,
                this.y - 0.5,
                this.z - 0.5,
                this.world.blocks[this.blockType]
            );
            this.playUnmovingSound('pock', 0.3);
            this.destroy();
        } else {
            this.x = this.from[0] * (1 - t) + this.to[0] * t + 0.5;
            this.y = this.from[1] * (1 - t) + this.to[1] * t + 0.5;
            this.z = this.from[2] * (1 - t) + this.to[2] * t + 0.5;
            this.vx = this.vy = this.vz = 0;
        }
    }
}
