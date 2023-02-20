/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from 'gl-matrix';
import { TriangleMesh, VoxelMesh } from '../../render/asset';
import { World } from '../world';

let entityCounter = 0;
const modelViewMatrix = mat4.create();
const transPos = new Float32Array([0, 0, 0]);

export class Entity {
    id: number;
    x = 0;
    y = 0;
    z = 0;
    vx = 0;
    vy = 0;
    vz = 0;

    yaw = 0;
    pitch = 0;
    roll = 0;

    destroyed = false;
    noClip = false;
    world: World;

    health = 12;
    maxHealth = 12;
    isDead = false;
    level = 0;
    weight = 1;

    constructor(world: World) {
        this.id = ++entityCounter;
        this.world = world;
        world.addEntity(this);
    }

    cooldown(ticks: number) {}

    destroy() {
        this.destroyed = true;
        this.world.removeEntity(this);
    }

    walkDirection(): [number, number] {
        const x = Math.sin(this.yaw);
        const z = Math.cos(this.yaw);
        return [x, z];
    }

    /* Walk/Run according to the direction of the Entity, ignores pitch */
    move(ox: number, oy: number, oz: number) {
        const nox = ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw);
        const noz = ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw);
        this.x += nox;
        this.z += noz;
        this.y += oy;
    }

    /* Fly into the direction the Entity is facing */
    fly(ox: number, oy: number, oz: number) {
        const [nox, noy, noz] = this.direction(ox, oy, oz);
        this.x += nox;
        this.y += noy;
        this.z += noz;
    }

    rotate(yaw: number, pitch: number) {
        this.yaw += yaw;
        this.pitch += pitch;
    }

    collides() {
        return (
            this.world.isSolid(this.x, this.y + 0.3, this.z) ||
            this.world.isSolid(this.x, this.y, this.z) ||
            this.world.isSolid(this.x, this.y - 0.3, this.z)
        );
    }

    onDeath() {}
    onAttack(perpetrator: Entity) {}

    damage(rawAmount: number) {
        this.health = Math.min(
            this.maxHealth,
            Math.max(0, this.health - rawAmount)
        );
        if (this.health <= 0) {
            this.isDead = true;
            this.onDeath();
        }
    }

    heal(rawAmount: number) {
        return this.damage(-rawAmount);
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

    direction(ox = 0, oy = 0, oz = 1, vel = 1): [number, number, number] {
        const nox =
            (ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw)) *
            Math.cos(-this.pitch);
        const noy = oy + oz * Math.sin(-this.pitch);
        const noz =
            (ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw)) *
            Math.cos(-this.pitch);
        return [nox * vel, noy * vel, noz * vel];
    }

    raycast(returnFront = false): [number, number, number] | null {
        const [dx, dy, dz] = this.direction(0, 0, -1, 0.0625);
        let x = this.x;
        let y = this.y;
        let z = this.z;
        let lastX = Math.floor(this.x);
        let lastY = Math.floor(this.y);
        let lastZ = Math.floor(this.z);
        if (this.world.isSolid(lastX, lastY, lastZ)) {
            return [lastX, lastY, lastZ];
        }

        for (let i = 0; i < 64; i++) {
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            const iz = Math.floor(z);
            if (ix != lastX || iy != lastY || iz != lastZ) {
                if (this.world.isSolid(ix, iy, iz)) {
                    return returnFront ? [lastX, lastY, lastZ] : [ix, iy, iz];
                }
                lastX = ix;
                lastY = iy;
                lastZ = iz;
            }
            x += dx;
            y += dy;
            z += dz;
        }
        return null;
    }

    mesh(): TriangleMesh | VoxelMesh {
        return this.world.game.render.assets.bag;
    }

    draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
        if (this.destroyed) {
            return;
        }
        this.world.game.render.decals.addShadow(this.x, this.y, this.z, 1);

        mat4.identity(modelViewMatrix);
        transPos[0] = this.x;
        transPos[1] = this.y;
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
        this.mesh().draw(modelViewMatrix, alpha);
    }

    beRepelledByEntities() {
        for (const e of this.world.entities) {
            if (e === this) {
                continue;
            }
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const dz = e.z - this.z;
            const dd = dx * dx + dy * dy * 0.5 + dz * dz;
            if (dd < 1.8) {
                const w = Math.max(
                    0.98,
                    Math.min(0.999, this.weight / e.weight)
                );
                this.vx =
                    this.vx * w + (dx < 0 ? 1.35 : -1.35 - dx) * (1.0 - w);
                this.vz =
                    this.vz * w + (dz < 0 ? 1.35 : -1.35 - dz) * (1.0 - w);
            }
        }
    }
}
