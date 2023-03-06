/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import voxelBagFile from '../../assets/vox/bag.vox?url';
import voxelFistFile from '../../assets/vox/fist.vox?url';
import voxelTestOutlineFile from '../../assets/vox/testOutline.vox?url';

import type { Game } from '../game';
import { BlockMesh } from './meshes/blockMesh/blockMesh';
import { DecalMesh } from './meshes/decalMesh/decalMesh';
import { ParticleMesh } from './meshes/particleMesh/particleMesh';
import { TriangleMesh } from './meshes/triangleMesh/triangleMesh';
import { VoxelMesh } from './meshes/voxelMesh/voxelMesh';
import { Texture } from './texture';

export class AssetList {
    game: Game;
    gl: WebGL2RenderingContext;

    cache: Map<string, VoxelMesh> = new Map();

    bag: VoxelMesh;
    fist: VoxelMesh;
    test: VoxelMesh;
    blockType: TriangleMesh[] = [];

    generateBlockTypeMeshes() {
        this.blockType.length = 0;
        const tex = new Texture(
            this.gl,
            'blocks2D',
            this.game.world.blockTextureUrl,
            '2D'
        );
        for (let i = 0; i < this.game.world.blocks.length; i++) {
            const mesh = new TriangleMesh(tex);
            mesh.addBlockType(this.game.world.blocks[i]);
            mesh.finish();
            this.blockType[i] = mesh;
        }
    }

    load(url: string) {
        const c = VoxelMesh.fromVoxFile(url);
        this.cache.set(url, c);
        return c;
    }

    get(url: string) {
        return this.cache.get(url) || this.load(url);
    }

    preload(urls: string[]) {
        for (const url of urls) {
            this.get(url);
        }
    }

    constructor(game: Game, gl: WebGL2RenderingContext) {
        this.game = game;
        this.gl = gl;
        BlockMesh.init(game, gl);
        DecalMesh.init(gl);
        TriangleMesh.init(gl);
        ParticleMesh.init(gl);
        VoxelMesh.init(gl);

        this.bag = VoxelMesh.fromVoxFile(voxelBagFile);
        this.fist = VoxelMesh.fromVoxFile(voxelFistFile);
        this.test = VoxelMesh.fromVoxFile(voxelTestOutlineFile);
        this.generateBlockTypeMeshes();
    }
}
