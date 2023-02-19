/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { VoxelMesh } from '../../render/asset';
import { Chunk } from '../chunk/chunk';
import { StaticObject } from './staticObject';
import meshUrl from '../../../assets/vox/staticStick.vox?url';
import { Entity } from '../entity/entity';
import { ItemDrop } from '../entity/itemDrop';
import { Stick } from '../item/material/stick';

export class StaticStick extends StaticObject {
    constructor(chunk: Chunk, x: number, y: number, z: number) {
        super(chunk, x, y, z);
    }

    mesh(): VoxelMesh {
        return this.chunk.world.game.render.assets.get(meshUrl);
    }

    onAttacked(perpetrator: Entity) {
        const item = new Stick(this.chunk.world, 1);
        new ItemDrop(
            this.chunk.world,
            this.x + 0.5,
            this.y + 0.5,
            this.z + 0.5,
            item
        );
        this.destroy();
    }

    transOff(): [number, number, number] {
        return [0.5 - 3 / 32, 1 / 32, 0.5 + 5 / 32];
    }
}
