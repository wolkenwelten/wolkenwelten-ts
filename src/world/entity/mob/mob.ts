/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4, vec3 } from 'gl-matrix';
import { World } from '../../world';
import { Entity } from '../entity';

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

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [
            this.x,
            this.y,
            this.z,
        ]);

        mat4.rotateY(modelViewMatrix, modelViewMatrix, this.yaw);
        mat4.mul(modelViewMatrix, viewMatrix, modelViewMatrix);
        mat4.mul(modelViewMatrix, projectionMatrix, modelViewMatrix);
        const dx = this.x - cam.x;
        const dy = this.y - cam.y;
        const dz = this.z - cam.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const alpha = Math.min(1, Math.max(0, 160.0 - d) / 8);
        this.mesh().draw(modelViewMatrix, alpha);
        if (d < 160) {
            this.world.game.render.decals.addShadow(this.x, this.y, this.z, 1);
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
