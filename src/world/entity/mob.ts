/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from 'gl-matrix';

import type { World } from '../world';
import type { Entity } from './entity';
import { Being } from './being';

const modelViewMatrix = mat4.create();
const transPos = new Float32Array([0, 0, 0]);

type MobConstructor = new (
    world: World,
    x: number,
    y: number,
    z: number
) => Mob;

export class Mob extends Being {
    static registry: Map<string, MobConstructor> = new Map();
    static register(name: string, con: MobConstructor) {
        this.registry.set(name, con);
    }

    static create(
        name: string,
        world: World,
        x: number,
        y: number,
        z: number
    ): Mob {
        const con = this.registry.get(name);
        if (con) {
            return new con(world, x, y, z);
        } else {
            throw new Error(`Unknown Mob ${name}`);
        }
    }

    constructor(world: World, x: number, y: number, z: number) {
        super(world, x, y, z);
    }

    draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
        if (this.destroyed) {
            return;
        }

        const mesh = this.mesh();
        if (!mesh) {
            return;
        }
        const yOff = (Math.floor(mesh.size.y / 2) * 1) / 32 - 6 / 32;
        mat4.identity(modelViewMatrix);
        transPos[0] = this.x;
        transPos[1] = this.y + yOff;
        transPos[2] = this.z;
        mat4.translate(modelViewMatrix, modelViewMatrix, transPos);

        mat4.rotateY(modelViewMatrix, modelViewMatrix, this.yaw);
        mat4.mul(modelViewMatrix, viewMatrix, modelViewMatrix);
        mat4.mul(modelViewMatrix, projectionMatrix, modelViewMatrix);
        const dx = this.x - cam.x;
        const dy = this.y - cam.y;
        const dz = this.z - cam.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const renderDistance = this.world.game.render.renderDistance;
        const alpha = Math.min(1, Math.max(0, renderDistance - d) / 8);

        mesh.draw(modelViewMatrix, alpha);
        if (d < renderDistance) {
            this.world.game.render.decals.addShadow(this.x, this.y, this.z, 1);
        }
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
        if (dd < 1.9 * 1.9) {
            entity.damage(dmg);
            entity.onAttack(this);
            const edx = this.x - entity.x;
            const edz = this.z - entity.z;
            entity.vx += edx * -0.02;
            entity.vy += 0.005;
            entity.vz += edz * -0.02;
        }
    }

    update() {
        super.update();
    }
}
