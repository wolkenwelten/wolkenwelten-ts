/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { VoxelMesh } from '../../render/asset';
import { Chunk } from '../chunk/chunk';
import { StaticObject } from './staticObject';
import meshUrl from '../../../assets/vox/grass.vox?url';

export class Grass extends StaticObject {
    constructor(chunk: Chunk, x: number, y: number, z: number) {
        super(chunk, x, y, z);
    }

    mesh(): VoxelMesh {
        return this.chunk.world.game.render.assets.get(meshUrl);
    }

    transOff(): [number, number, number] {
        return [-0.5, -1 + 6 / 32, -0.5];
    }
}
