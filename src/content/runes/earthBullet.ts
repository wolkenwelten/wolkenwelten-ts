/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/earthBullet.png';
import meshUrl from '../../../assets/vox/items/stone.vox?url';
import type { TriangleMesh } from '../../render/meshes/triangleMesh/triangleMesh';
import type { VoxelMesh } from '../../render/meshes/voxelMesh/voxelMesh';
import { Character } from '../../world/entity/character';
import { Entity } from '../../world/entity/entity';
import { Mob } from '../../world/entity/mob';
import { World } from '../../world/world';

import { Rune } from './rune';

export class EarthBullet extends Rune {
    name = 'Earth bullet';
    icon = itemIcon;
    meshUrl = meshUrl;
    range = 8;

    bulletEntity?: EarthBulletEntity;

    use(e: Character) {
        if (this.bulletEntity) {
            return;
        }
        const ray = e.raycast(false);
        if (!ray) {
            return;
        }
        const [x, y, z] = ray;
        const blockType = e.world.getBlock(x, y, z);
        if (blockType === undefined) {
            return;
        }
        const dx = x + 0.5 - e.x;
        const dy = y + 0.5 - e.y;
        const dz = z + 0.5 - e.z;
        const dd = dx * dx + dy * dy + dz * dz;
        if (dd > this.range * this.range) {
            return;
        }
        const bt = this.world.blocks[blockType];
        if (bt.miningCat !== 'Pickaxe') {
            return;
        }
        this.world.game.render.particle.fxBlockBreak(x, y, z, bt);
        e.world.setBlock(x, y, z, 0);
        this.world.dangerZone.add(x - 1, y - 1, z - 1, 3, 3, 3);
        this.bulletEntity = new EarthBulletEntity(this.world, blockType, e);
        this.bulletEntity.x = x + 0.5;
        this.bulletEntity.y = y + 0.5;
        this.bulletEntity.z = z + 0.5;
        this.bulletEntity.scale = 2;
        this.bulletEntity.playUnmovingSound('tock', 0.3);

        e.cooldown(32);
        e.hitAnimation = this.world.game.render.frames;
    }

    useRelease(e: Character) {
        if (!this.bulletEntity) {
            return;
        }
        this.bulletEntity.caster = undefined;
        const dx = e.x - this.bulletEntity.x;
        const dy = e.y - this.bulletEntity.y;
        const dz = e.z - this.bulletEntity.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const vel = Math.max(0.1, Math.min(0.5, 1 - d * 0.1));
        const [vx, vy, vz] = e.direction(0, 0, -2, vel);
        this.bulletEntity.vx = vx;
        this.bulletEntity.vy = vy;
        this.bulletEntity.vz = vz;

        this.bulletEntity = undefined;

        e.cooldown(32);
        e.hitAnimation = this.world.game.render.frames;
        this.world.game.render.shake.add(0.2);
    }
}

export class EarthBulletEntity extends Entity {
    blockType: number;
    caster?: Character;
    source?: Character;
    ticksAlive = 0;

    constructor(world: World, blockType: number, caster: Character) {
        super(world);
        if (blockType === 2) {
            blockType = 1;
        }
        this.blockType = blockType;
        this.caster = caster;
        this.source = caster;
        this.vy = 0.2;
    }

    mesh(): TriangleMesh | VoxelMesh | null {
        return (
            this.world.game.render.assets.blockType[this.blockType] ||
            this.world.game.render.assets.bag
        );
    }

    private placeBlock() {
        if (!this.world.getBlock(this.x, this.y, this.z)) {
            this.world.setBlock(this.x, this.y, this.z, this.blockType);
            this.world.dangerZone.add(
                this.x - 1,
                this.y - 1,
                this.z - 1,
                3,
                3,
                3
            );
            return;
        }
        for (let ox = -1; ox < 2; ox++) {
            for (let oy = -1; oy < 2; oy++) {
                for (let oz = -1; oz < 2; oz++) {
                    if (
                        !this.world.getBlock(
                            this.x + ox,
                            this.y + oy,
                            this.z + oz
                        )
                    ) {
                        this.world.setBlock(
                            this.x + ox,
                            this.y + oy,
                            this.z + oz,
                            this.blockType
                        );
                        this.world.dangerZone.add(
                            this.x + ox - 1,
                            this.y + oy - 1,
                            this.z + oz - 1,
                            3,
                            3,
                            3
                        );
                        return;
                    }
                }
            }
        }
    }

    private checkForEntityCollisions() {
        for (const e of this.world.entities) {
            if (
                e === this ||
                (this.ticksAlive < 16 && e === this.source) ||
                e.destroyed
            ) {
                continue;
            }
            if (!(e instanceof Mob || e instanceof Character)) {
                continue;
            }
            const dx = e.x - this.x;
            const dy = e.y - this.y - 0.5;
            const dz = e.z - this.z;
            const dd = dx * dx + dy * dy * 0.5 + dz * dz;
            if (dd <= 1.1) {
                const dmg = Math.max(
                    2,
                    this.world.blocks[this.blockType].health * 0.05
                );
                this.source?.doDamage(e, dmg);
                this.placeBlock();
                this.playUnmovingSound('pock', 0.3);
                this.destroy();
                return;
            }
        }
    }

    update() {
        super.update();
        if (this.caster) {
            const [dirx, diry, dirz] = this.caster.direction(0, 0, -1, 1.5);
            const goalX = this.caster.x + dirx;
            const goalY = this.caster.y + diry;
            const goalZ = this.caster.z + dirz;

            const dx = goalX - this.x;
            const dy = goalY - this.y;
            const dz = goalZ - this.z;
            const dd = dx * dx + dy * dy + dz * dz;
            const vmax = dd * 0.02;

            const dn = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
            this.vx += (dx / dn) * 0.02;
            this.vy += (dy / dn) * 0.04;
            this.vz += (dz / dn) * 0.02;
            if (this.vx > 0) {
                this.vx = Math.min(vmax, this.vx);
            } else {
                this.vx = Math.max(-vmax, this.vx);
            }
            if (this.vy > 0) {
                this.vy = Math.min(vmax, this.vy);
            } else {
                this.vy = Math.max(-vmax, this.vy);
            }
            if (this.vz > 0) {
                this.vz = Math.min(vmax, this.vz);
            } else {
                this.vz = Math.max(-vmax, this.vz);
            }

            this.yaw = this.caster.yaw;
        } else {
            ++this.ticksAlive;
            this.world.game.render.particle.fxBlockMine(
                this.x - 0.5,
                this.y - 0.5,
                this.z - 0.5,
                this.world.blocks[this.blockType]
            );
            const vv =
                this.vx * this.vx + this.vy * this.vy + this.vz * this.vz;
            if (vv < 0.01 && this.collides()) {
                this.world.game.render.particle.fxBlockBreak(
                    this.x - 0.5,
                    this.y - 0.5,
                    this.z - 0.5,
                    this.world.blocks[this.blockType]
                );
                this.placeBlock();
                this.playUnmovingSound('pock', 0.3);
                this.destroy();
                return;
            }
            this.checkForEntityCollisions();
        }
    }
}
