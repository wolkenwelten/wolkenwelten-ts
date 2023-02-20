/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Entity } from './entity';
import { TriangleMesh, VoxelMesh } from '../../render/asset';
import { Mob } from './mob/mob';
import { mat4 } from 'gl-matrix';

export class Projectile extends Entity {
    weight = 1;
    source: Entity;
    projectileMesh: VoxelMesh;
    onHit?: (e: Entity) => void;
    onMiss?: () => void;
    onUpdate?: () => void;

    constructor(source: Entity, speed: number) {
        super(source.world);
        this.source = source;

        this.x = source.x;
        this.y = source.y;
        this.z = source.z;
        this.yaw = source.yaw;
        this.pitch = source.pitch;
        const [vx, vy, vz] = source.direction(0, 0, -1, speed * 0.5);

        this.vx = vx;
        this.vy = vy;
        this.vz = vz;

        this.projectileMesh = source.world.game.render.assets.fist;
    }

    mesh(): TriangleMesh | VoxelMesh {
        return this.projectileMesh;
    }

    private checkForEntityCollisions() {
        for (const e of this.world.entities) {
            if (e === this || e === this.source || e.destroyed) {
                continue;
            }
            if (!(e instanceof Mob)) {
                continue;
            }
            const dx = e.x - this.x;
            const dy = e.y - this.y - 0.5;
            const dz = e.z - this.z;
            const dd = dx * dx + dy * dy * 0.5 + dz * dz;
            if (dd <= 0.5) {
                this.onHit && this.onHit(e);
                this.destroy();
                return;
            }
        }
    }

    update() {
        if (this.destroyed) {
            return;
        }
        super.update();
        this.checkForEntityCollisions();
        this.onUpdate && this.onUpdate();
        const vv = this.vx * this.vx + this.vy * this.vy + this.vz * this.vz;
        if (vv < 0.01) {
            this.onMiss && this.onMiss();
            this.destroy();
        }
    }
}
