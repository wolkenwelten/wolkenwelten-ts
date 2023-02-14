import { VoxelMesh } from '../../../render/meshes';
import { World } from '../../world';
import { Mob } from './mob';
import { CrabMeatRaw } from '../../item/food/crabMeatRaw';
import { Entity } from '../entity';
import { radianDifference } from '../../../util/math';

export type CrabState =
    | 'idle'
    | 'walk'
    | 'turnLeft'
    | 'turnRight'
    | 'walkBack'
    | 'chase'
    | 'attack';

export class Crab extends Mob {
    state: CrabState;
    ticksInState = 0;
    stateTransitions = 0;

    gvx = 0;
    gvz = 0;

    health = 4;
    maxHealth = 4;

    aggroTarget?: Entity;

    constructor(world: World, x: number, y: number, z: number) {
        super(world, x, y, z);
        this.state = 'idle';
        this.ticksInState = this.id * 123;
        this.stateTransitions = this.id * 123;
    }

    onDeath() {
        this.world.game.render.particle.fxDeath(this.x, this.y, this.z);
        if ((this.id & 3) == 0) {
            this.world.game.add.itemDrop(
                this.x,
                this.y,
                this.z,
                new CrabMeatRaw(this.world)
            );
        }
    }

    onAttack(perpetrator: Entity): void {
        this.aggroTarget = perpetrator;
        this.changeState('chase');
    }

    mesh(): VoxelMesh {
        switch (this.state) {
            default: {
                const frame =
                    ((this.id * 120 + this.world.game.ticks) / 40) & 1;
                return this.world.game.render.meshes.crab.idle[frame];
            }
            case 'attack': {
                const frame = this.ticksInState / 30;
                return this.world.game.render.meshes.crab.attack[frame & 1];
            }
            case 'chase':
                const frame = ((this.id * 32 + this.world.game.ticks) / 6) & 3;
                if (frame & 1) {
                    return this.world.game.render.meshes.crab.idle[0];
                }
                return this.world.game.render.meshes.crab.walk[frame >> 1];
            case 'turnLeft':
            case 'turnRight':
            case 'walkBack':
            case 'walk': {
                const frame = ((this.id * 32 + this.world.game.ticks) / 8) & 3;
                if (frame & 1) {
                    return this.world.game.render.meshes.crab.idle[0];
                }
                return this.world.game.render.meshes.crab.walk[frame >> 1];
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
                if (v > 50) {
                    if (this.aggroTarget) {
                        this.attack(this.aggroTarget, 1);
                        this.changeState('chase');
                    } else {
                        this.changeState('idle');
                    }
                } else if (v === 33) {
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
        }
    }

    doState() {
        switch (this.state) {
            default:
                this.gvx = 0;
                this.gvz = 0;
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
                    if (dd > 16 * 16) {
                        this.aggroTarget = undefined;
                        this.changeState('idle');
                    } else {
                        if (dd > 1.8 * 1.8) {
                            const [vx, vz] = this.walkDirection();
                            this.gvx = vx * -3.5;
                            this.gvz = vz * -3.5;
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

        if (this.isSolidPillar(this.x, this.y - 8 / 32, this.z)) {
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

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vy -= 0.005;
    }
}
