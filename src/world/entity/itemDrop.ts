import { Entity } from './entity';
import { World } from '../world';
import { Item } from '../item/item';
import { mat4, vec3 } from 'gl-matrix';
import { off } from 'process';

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

    update() {
        Entity.prototype.update.call(this);
        const player = this.world.game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dz = player.z - this.z;
        const dd = dx * dx + dy * dy + dz * dz;

        if (this.noCollect) {
            if (dd > 2 * 2) {
                this.noCollect = false;
            }
        } else {
            if (dd < 2 * 2) {
                if (player.inventory.add(this.item)) {
                    this.destroy();
                }
            }
        }
    }

    draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
        if (this.destroyed) {
            return;
        }
        const modelViewMatrix = mat4.create();
        const yOff = Math.sin(this.id * 7 + this.world.game.ticks * 0.1) * 0.1;
        mat4.translate(modelViewMatrix, modelViewMatrix, [
            this.x,
            this.y + yOff,
            this.z,
        ]);

        mat4.scale(
            modelViewMatrix,
            modelViewMatrix,
            vec3.fromValues(1 / 32, 1 / 32, 1 / 32)
        );
        mat4.mul(modelViewMatrix, viewMatrix, modelViewMatrix);

        const mesh = this.mesh();
        mesh.draw(projectionMatrix, modelViewMatrix, 1.0);
    }
}
