/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { VoxelMesh } from '../../../render/asset';
import { World } from '../../world';
import { Mob } from './mob';
import { CrabMeatRaw } from '../../item/food/crabMeatRaw';
import { Entity } from '../entity';
import { radianDifference } from '../../../util/math';

import voxelCrabIdle0File from '../../../../assets/vox/crab/idle_0.vox?url';
import voxelCrabIdle1File from '../../../../assets/vox/crab/idle_1.vox?url';
import voxelCrabWalk0File from '../../../../assets/vox/crab/walk_0.vox?url';
import voxelCrabWalk1File from '../../../../assets/vox/crab/walk_1.vox?url';
import voxelCrabAttack0File from '../../../../assets/vox/crab/attack_0.vox?url';
import voxelCrabAttack1File from '../../../../assets/vox/crab/attack_1.vox?url';
import voxelCrabDead0File from '../../../../assets/vox/crab/dead_0.vox?url';

export type CrabState =
    | 'idle'
    | 'walk'
    | 'turnLeft'
    | 'turnRight'
    | 'walkBack'
    | 'chase'
    | 'attack'
    | 'justHit'
    | 'dead';

export class Crab extends Mob {
    state: CrabState;
    ticksInState = 0;
    stateTransitions = 0;

    gvx = 0;
    gvz = 0;

    aggroTarget?: Entity;
    health = 16;
    maxHealth = 16;
    level = 2;
    weight = 10;

    constructor(world: World, x: number, y: number, z: number) {
        super(world, x, y, z);
        this.state = 'idle';
        this.ticksInState = this.id * 123;
        this.stateTransitions = this.id * 123;
        this.world.game.render.assets.preload([
            voxelCrabIdle0File,
            voxelCrabIdle1File,
            voxelCrabWalk0File,
            voxelCrabWalk1File,
            voxelCrabAttack0File,
            voxelCrabAttack1File,
        ]);
    }

    onDeath() {
        if (this.state === 'dead') {
            return;
        }
        this.world.game.render.particle.fxDeath(this.x, this.y, this.z);
        this.world.game.add.itemDrop(
            this.x + (Math.random() - 0.5) * 0.3,
            this.y,
            this.z + (Math.random() - 0.5) * 0.3,
            new CrabMeatRaw(this.world)
        );
        this.changeState('dead');
        this.isDead = true;
        this.world.game.audio.play("crabDeath", 0.5);
    }

    onAttack(perpetrator: Entity): void {
        if (this.isDead) {
            return;
        }
        this.aggroTarget = perpetrator;
        this.changeState('justHit');
        for (const e of this.world.entities) {
            if (e === this) {
                continue;
            }
            if (e instanceof Crab) {
                if (
                    e.isDead ||
                    e.state === 'justHit' ||
                    e.state === 'chase' ||
                    e.state === 'attack'
                ) {
                    continue;
                }
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dz = e.z - this.z;
                const dd = dx * dx + dy * dy + dz * dz;
                if (dd < 24 * 24) {
                    e.aggroTarget = perpetrator;
                    e.changeState('chase');
                    this.world.game.audio.play("crabClick", 0.5);
                }
            }
        }
        this.world.game.audio.play("crabClick", 0.3);
    }

    mesh(): VoxelMesh {
        switch (this.state) {
            default: {
                const frame =
                    ((this.id * 120 + this.world.game.ticks) / 40) & 1;
                const url = frame ? voxelCrabIdle0File : voxelCrabIdle1File;
                return this.world.game.render.assets.get(url);
            }
            case 'justHit':
            case 'dead': {
                return this.world.game.render.assets.get(voxelCrabDead0File);
            }
            case 'attack': {
                const frame = this.ticksInState / 20;
                const url =
                    frame & 1 ? voxelCrabAttack0File : voxelCrabAttack1File;
                return this.world.game.render.assets.get(url);
            }
            case 'chase':
                const frame = ((this.id * 32 + this.world.game.ticks) / 6) & 3;
                if (frame & 1) {
                    return this.world.game.render.assets.get(
                        voxelCrabIdle0File
                    );
                }
                const url =
                    frame >> 1 ? voxelCrabWalk0File : voxelCrabWalk1File;
                return this.world.game.render.assets.get(url);
            case 'turnLeft':
            case 'turnRight':
            case 'walkBack':
            case 'walk': {
                const frame = ((this.id * 32 + this.world.game.ticks) / 8) & 3;
                if (frame & 1) {
                    return this.world.game.render.assets.get(
                        voxelCrabIdle0File
                    );
                }
                const url =
                    frame >> 1 ? voxelCrabWalk0File : voxelCrabWalk1File;
                return this.world.game.render.assets.get(url);
            }
        }
    }

    changeState(newState: CrabState) {
        this.state = newState;
        this.ticksInState = 0;
        this.stateTransitions++;
    }

    attack(entity: Entity, dmg = 1) {
        const [vx, vz] = this.walkDirection();
        const x = this.x - vx;
        const y = this.y;
        const z = this.z - vz;
        const dx = x - entity.x;
        const dy = y - entity.y;
        const dz = z - entity.z;
        const dd = dx * dx + dy * dy + dz * dz;
        if (dd < 1.7 * 1.7) {
            entity.damage(dmg);
            entity.onAttack(this);
            const edx = this.x - entity.x;
            const edz = this.z - entity.z;
            entity.vx += edx * -0.02;
            entity.vy += 0.005;
            entity.vz += edz * -0.02;
        }
    }

    stateChange() {
        switch (this.state) {
            case 'idle': {
                const v = this.ticksInState;
                if (v > 50) {
                    if (this.stateTransitions % 3 !== 0) {
                        this.changeState('walk');
                    } else {
                        if (this.stateTransitions % 5 !== 0) {
                            this.changeState('turnLeft');
                        } else {
                            if (this.stateTransitions % 7 !== 0) {
                                this.changeState('turnRight');
                            } else {
                                this.changeState('walkBack');
                            }
                        }
                    }
                }
                break;
            }
            case 'attack': {
                const v = this.ticksInState;
                if (v > 33) {
                    if (this.aggroTarget) {
                        this.attack(this.aggroTarget, 1);
                        this.changeState('chase');
                    } else {
                        this.changeState('idle');
                    }
                } else if (v === 20) {
                    this.world.game.audio.play('punchMiss', 0.5);
                }
                break;
            }

            case 'chase':
                if (!this.aggroTarget || this.aggroTarget.isDead) {
                    this.aggroTarget = undefined;
                    this.changeState('idle');
                }
                break;
            case 'turnLeft':
            case 'turnRight':
            case 'walkBack':
            case 'walk': {
                const v = this.ticksInState;
                if (v > 100) {
                    this.changeState('idle');
                }
                break;
            }
            case 'justHit':
                if (this.ticksInState > 16) {
                    this.changeState('chase');
                }
                break;
            case 'dead':
                if (this.ticksInState > 600) {
                    this.destroy();
                }
                break;
            default:
                break;
        }
    }

    doState() {
        switch (this.state) {
            default:
                this.gvx = 0;
                this.gvz = 0;
                break;
            case 'dead':
                this.gvx = 0;
                this.gvz = 0;
                if (this.ticksInState > 200) {
                    this.y -= 0.001;
                }
                break;
            case 'walk': {
                const [vx, vz] = this.walkDirection();
                this.gvx = vx * -2;
                this.gvz = vz * -2;
                break;
            }
            case 'walkBack': {
                const [vx, vz] = this.walkDirection();
                this.gvx = vx;
                this.gvz = vz;
                break;
            }
            case 'turnLeft':
                this.yaw += 0.01;
                break;
            case 'turnRight':
                this.yaw -= 0.01;
                break;
            case 'chase':
                if (this.aggroTarget) {
                    const dx = this.x - this.aggroTarget.x;
                    const dy = this.y - this.aggroTarget.y;
                    const dz = this.z - this.aggroTarget.z;
                    const dd = dx * dx + dy * dy + dz * dz;
                    if (dd > 28 * 28) {
                        this.aggroTarget = undefined;
                        this.changeState('idle');
                    } else {
                        if (dd > 1.7 * 1.7) {
                            const [vx, vz] = this.walkDirection();
                            this.gvx = vx * -5;
                            this.gvz = vz * -5;
                        } else {
                            this.changeState('attack');
                        }

                        const newYaw = -Math.atan2(dz, dx);
                        const diff = radianDifference(this.yaw, newYaw);
                        if (diff > 0) {
                            this.yaw += Math.min(0.05, diff);
                        } else {
                            this.yaw += Math.max(-0.05, diff);
                        }
                    }
                }
                break;
        }
    }

    isSolidPillar(x: number, y: number, z: number): boolean {
        return (
            this.world.isSolid(x, y, z) ||
            this.world.isSolid(x, y - 2 / 32, z) ||
            this.world.isSolid(x, y + 12 / 32, z)
        );
    }

    updatePhysics() {
        if (this.isSolidPillar(this.x - 0.4, this.y, this.z)) {
            this.vx = Math.max(0, this.vx);
        }
        if (this.isSolidPillar(this.x + 0.4, this.y, this.z)) {
            this.vx = Math.min(0, this.vx);
        }

        if (this.isSolidPillar(this.x, this.y, this.z - 0.4)) {
            this.vz = Math.max(0, this.vz);
        }
        if (this.isSolidPillar(this.x, this.y, this.z + 0.4)) {
            this.vz = Math.min(0, this.vz);
        }

        if (this.isSolidPillar(this.x, this.y - 5 / 32, this.z)) {
            if (
                !this.isDead &&
                this.isSolidPillar(this.x, this.y - 4 / 32, this.z)
            ) {
                this.y += 1 / 32;
            }
            this.vy = Math.max(0, this.vy);
            const accel = 0.5;
            this.vx = this.vx * (1.0 - accel) + this.gvx * 0.01 * accel;
            this.vz = this.vz * (1.0 - accel) + this.gvz * 0.01 * accel;
        }
        if (this.isSolidPillar(this.x, this.y + 0.2, this.z)) {
            this.vy = Math.min(0, this.vy);
        }
    }

    update() {
        this.ticksInState++;
        if (this.noClip) {
            this.vx = this.vy = this.vz = 0;
            return;
        }

        this.stateChange();
        this.doState();
        this.updatePhysics();
        this.beRepelledByEntities();

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vy -= 0.005;
    }
}
