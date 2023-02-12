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
        this.world.game.render.decals.addShadow(this.x, this.y, this.z, 1);
        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [
            this.x,
            this.y,
            this.z,
        ]);

        mat4.scale(
            modelViewMatrix,
            modelViewMatrix,
            vec3.fromValues(1 / 32, 1 / 32, 1 / 32)
        );
        mat4.rotateY(modelViewMatrix, modelViewMatrix, this.yaw);
        mat4.mul(modelViewMatrix, viewMatrix, modelViewMatrix);
        mat4.mul(modelViewMatrix, projectionMatrix, modelViewMatrix);
        this.mesh().draw(modelViewMatrix, 1.0);
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
}
