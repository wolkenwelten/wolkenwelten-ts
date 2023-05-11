/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/comet.png';
import meshUrl from '../../../assets/vox/items/stone.vox?url';
import type { TriangleMesh } from '../../render/meshes/triangleMesh/triangleMesh';
import type { VoxelMesh } from '../../render/meshes/voxelMesh/voxelMesh';
import { Mob } from '../../world/entity/mob';
import { Character } from '../../world/entity/character';
import { Entity } from '../../world/entity/entity';
import type { World } from '../../world/world';
import { Fire } from '../../world/fireSystem';
import { Rune } from './rune';

export class Comet extends Rune {
    name = 'Comet';
    icon = itemIcon;
    meshUrl = meshUrl;

    private lastUseFrameCount = -1;
    range = 12;

    use(e: Character) {
        if (e.isOnCooldown()) {
            return;
        }
        const frame = e.world.game.render.frames;
        const decals = e.world.game.render.decals;
        if (this.lastUseFrameCount !== frame) {
            const ray = e.raycast(false);
            if (ray) {
                const [x, y, z] = ray;
                const dx = x - e.x;
                const dy = y - e.y;
                const dz = z - e.z;
                const dd = dx * dx + dy * dy + dz * dz;
                if (dd > this.range * this.range) {
                    return;
                }
                decals.addBlock(x, y, z, 0, 2);
                this.lastUseFrameCount = frame;
            }
        }
    }

    useRelease(e: Character) {
        if (e.isOnCooldown()) {
            return;
        }
        const ray = e.raycast(false);
        if (ray) {
            const [x, y, z] = ray;
            const dx = x - e.x;
            const dy = y - e.y;
            const dz = z - e.z;
            const dd = dx * dx + dy * dy + dz * dz;
            if (dd > this.range * this.range) {
                return;
            }
            for (let i = 0; i < 12; i++) {
                const comet = new CometEntity(e.world, 4, e);
                const ox = (Math.random() - 0.5) * 6;
                const oy = Math.random() * 24;
                const oz = (Math.random() - 0.5) * 6;
                comet.x = x + 1 + ox;
                comet.y = y + 96 + oy;
                comet.z = z + 1 + oz;
                comet.vy = -1;
                comet.vx = (Math.random() - 0.5) * 0.1;
                comet.vz = (Math.random() - 0.5) * 0.1;
            }
        }
        e.cooldown(128);
    }
}

export class CometEntity extends Entity {
    blockType: number;
    caster?: Character;
    source?: Character;
    ticksAlive = 0;

    constructor(world: World, blockType: number, caster: Character) {
        super(world);
        this.blockType = blockType;
        this.caster = caster;
        this.source = caster;
        this.vy = 0.2;
        this.playSound('projectile', 1, true);
    }

    mesh(): TriangleMesh | VoxelMesh | null {
        return (
            this.world.game.render.assets.blockType[this.blockType] ||
            this.world.game.render.assets.bag
        );
    }

    private removeArea(x: number, y: number, z: number) {
        for (let ox = -1; ox < 2; ox++) {
            for (let oy = -1; oy < 2; oy++) {
                for (let oz = -1; oz < 2; oz++) {
                    this.world.setBlock(x + ox, y + oy, z + oz, 0);
                    this.world.fire.add(x + ox, y + oy, z + oz, 4096);
                }
            }
        }
        this.playUnmovingSound('bomb', 1);
    }

    private damageMobs(x: number, y: number, z: number) {
        for (const e of this.world.entities) {
            if (e === this || e.destroyed) {
                continue;
            }
            if (!(e instanceof Mob || e instanceof Character)) {
                continue;
            }
            const dx = e.x - x;
            const dy = e.y - y - 0.5;
            const dz = e.z - z;
            const dd = dx * dx + dy * dy * 0.5 + dz * dz;
            if (dd <= 3 * 3) {
                const dmg = Math.max(1, Math.floor(9 - dd));
                this.source?.doDamage(e, dmg * dmg);
            }
            if (e === this.world.game.player) {
                this.world.game.render.shake.add(Math.max(0, 27 - dd) * 3);
            }
        }
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
                        this.removeArea(this.x + ox, this.y + oy, this.z + oz);
                        this.damageMobs(this.x + ox, this.y + oy, this.z + oz);
                        this.world.setBlock(
                            this.x + ox,
                            this.y + oy - 1,
                            this.z + oz,
                            this.blockType
                        );
                        this.world.dangerZone.add(
                            this.x + ox - 2,
                            this.y + oy - 2,
                            this.z + oz - 2,
                            5,
                            5,
                            5
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

        ++this.ticksAlive;

        Fire.addParticle(
            this.world,
            this.x - 0.5,
            this.y - 0.5,
            this.z - 0.5,
            4096
        );
        Fire.addParticle(
            this.world,
            this.x - 0.5,
            this.y - 0.5,
            this.z - 0.5,
            4096
        );
        Fire.addParticle(
            this.world,
            this.x - 0.5,
            this.y - 0.5,
            this.z - 0.5,
            4096
        );

        const vv = this.vx * this.vx + this.vy * this.vy + this.vz * this.vz;
        if (vv < 0.01 && this.collides()) {
            this.placeBlock();
            this.playUnmovingSound('pock', 0.3);
            this.destroy();
            return;
        }
        this.checkForEntityCollisions();
    }
}
