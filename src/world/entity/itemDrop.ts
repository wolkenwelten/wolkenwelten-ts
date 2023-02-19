/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Entity } from './entity';
import { World } from '../world';
import { Item } from '../item/item';
import { mat4, vec3 } from 'gl-matrix';
import { TriangleMesh, VoxelMesh } from '../../render/asset';

export class ItemDrop extends Entity {
    item: Item;
    noCollect = false;

    constructor(world: World, x: number, y: number, z: number, item: Item) {
        super(world);

        this.x = x;
        this.y = y;
        this.z = z;
        this.item = item;
    }

    mesh(): TriangleMesh | VoxelMesh {
        return this.item.mesh(this.world);
    }

    update() {
        super.update();
        const player = this.world.game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dz = player.z - this.z;
        const dd = dx * dx + dy * dy + dz * dz;

        if (this.noCollect) {
            if (dd > 2.4 * 2.4) {
                this.noCollect = false;
            }
        } else {
            if (dd < 2.4 * 2.4) {
                this.vx += dx * 0.006;
                this.vy += dy * 0.006;
                this.vz += dz * 0.006;
            }
            if (dd < 1.3 * 1.3) {
                if (player.inventory.add(this.item)) {
                    this.destroy();
                    this.world.game.audio.play('pock');
                }
            }
        }
    }

    draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
        if (this.destroyed) {
            return;
        }
        this.world.game.render.decals.addShadow(this.x, this.y, this.z, 1);
        const modelViewMatrix = mat4.create();
        const yOff =
            Math.sin(this.id * 7 + this.world.game.ticks * 0.07) * 0.1 + 0.2;
        mat4.translate(modelViewMatrix, modelViewMatrix, [
            this.x,
            this.y + yOff,
            this.z,
        ]);

        mat4.rotateY(
            modelViewMatrix,
            modelViewMatrix,
            this.id * 7 + this.world.game.ticks * 0.01
        );
        mat4.mul(modelViewMatrix, viewMatrix, modelViewMatrix);
        mat4.mul(modelViewMatrix, projectionMatrix, modelViewMatrix);
        const dx = this.x - cam.x;
        const dy = this.y - cam.y;
        const dz = this.z - cam.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const alpha = Math.min(1, Math.max(0, 160.0 - d) / 8);
        this.mesh().draw(modelViewMatrix, alpha);
    }
}
