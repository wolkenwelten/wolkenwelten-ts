/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { VoxelMesh } from '../../../engine/render/asset';
import { Entity } from '../entity/entity';
import { Chunk } from './chunk';

let idCounter = 1;

type StaticObjectConstructor = new (
    chunk: Chunk,
    x: number,
    y: number,
    z: number
) => StaticObject;

export class StaticObject {
    static registry: Map<string, StaticObjectConstructor> = new Map();
    id: number;
    x: number;
    y: number;
    z: number;
    chunk: Chunk;
    destroyed = false;

    static register(name: string, con: StaticObjectConstructor) {
        this.registry.set(name, con);
    }

    static create(
        name: string,
        chunk: Chunk,
        x: number,
        y: number,
        z: number
    ): StaticObject {
        const con = this.registry.get(name);
        if (!con) {
            throw new Error(`Couldn't find StaticObject ${name}`);
        } else {
            return new con(chunk, x, y, z);
        }
    }

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
