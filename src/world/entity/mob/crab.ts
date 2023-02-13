import { VoxelMesh } from '../../../render/meshes';
import { World } from '../../world';
import { Mob } from './mob';
import { CrabMeatRaw } from '../../item/food/crabMeatRaw';

export type CrabState = 'idle' | 'walk' | 'turnLeft' | 'turnRight' | 'walkBack';

export class Crab extends Mob {
    state: CrabState;
    ticksInState = 0;
    stateTransitions = 0;

    gvx = 0;
    gvz = 0;

    health = 4;
    maxHealth = 4;

    constructor(world: World, x: number, y: number, z: number) {
        super(world, x, y, z);
        this.state = 'idle';
        this.ticksInState = this.id * 123;
        this.stateTransitions = this.id * 123;
    }

    onDeath() {
        this.world.game.render.particle.fxDeath(this.x, this.y, this.z);
        this.world.game.add.itemDrop(
            this.x,
            this.y,
            this.z,
            new CrabMeatRaw(this.world)
        );
    }

    mesh(): VoxelMesh {
        switch (this.state) {
            default: {
                const frame =
                    ((this.id * 120 + this.world.game.ticks) / 40) & 1;
                return this.world.game.render.meshes.crab.idle[frame];
            }
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
            }
            case 'turnLeft':
            case 'turnRight':
            case 'walkBack':
            case 'walk': {
                const v = this.ticksInState;
                if (v > 100) {
                    this.changeState('idle');
                }
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
            case 'turnLeft':
                this.yaw -= 0.01;
                break;
        }
    }

    isSolidPillar(x: number, y: number, z: number): boolean {
        return (
            this.world.isSolid(x, y, z) ||
            this.world.isSolid(x, y - 2 / 32, z) ||
            this.world.isSolid(x, y + 0.4, z)
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
