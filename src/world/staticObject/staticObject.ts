/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { registerClass } from '../../class';
import { VoxelMesh } from '../../render/asset';
import { Chunk } from '../chunk/chunk';
import { Entity } from '../entity/entity';

let idCounter = 1;

export class StaticObject {
    id: number;
    x: number;
    y: number;
    z: number;
    chunk: Chunk;

    destroyed = false;

    constructor(chunk: Chunk, x: number, y: number, z: number) {
        this.id = idCounter++;
        this.chunk = chunk;
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.z = Math.floor(z);

        chunk.staticAdd(this);
    }

    destroy() {
        this.destroyed = true;
        this.chunk.staticDelete(this);
    }

    mesh(): VoxelMesh {
        return this.chunk.world.game.render.assets.test;
    }

    transOff(): [number, number, number] {
        return [-0.5, -0.5, -0.5];
    }

    onAttacked(perpetrator: Entity) {}
}
registerClass(StaticObject);
