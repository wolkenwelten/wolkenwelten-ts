/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from 'gl-matrix';
import { World } from '../../world';
import { Entity } from '../entity';

const modelViewMatrix = mat4.create();
const transPos = new Float32Array([0, 0, 0]);

export class Mob extends Entity {
    constructor(world: World, x: number, y: number, z: number) {
        super(world);
        this.x = x;
        this.y = y;
        this.z = z;
    }

    draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
        if (this.destroyed) {
            return;
        }

        const mesh = this.mesh();
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
        if (this.noClip) {
            this.vx = this.vy = this.vz = 0;
            return;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vy -= 0.005;

        if (this.collides()) {
            this.vy = 0;
            this.vx = 0;
            this.vz = 0;
        }
    }

    onDeath() {}
    onAttack(perpetrator: Entity): void {}
}
