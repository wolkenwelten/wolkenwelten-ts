import { Game } from '../game';
import { BlockMesh } from './meshes/blockMesh/blockMesh';
import { DecalMesh } from './meshes/decalMesh/decalMesh';
import { TriangleMesh } from './meshes/triangleMesh/triangleMesh';
import { ParticleMesh } from './meshes/particleMesh/particleMesh';
import { VoxelMesh } from './meshes/voxelMesh/voxelMesh';

export { BlockMesh } from './meshes/blockMesh/blockMesh';
export { DecalMesh } from './meshes/decalMesh/decalMesh';
export { TriangleMesh } from './meshes/triangleMesh/triangleMesh';
export { VoxelMesh } from './meshes/voxelMesh/voxelMesh';
import { Texture } from './texture';

import voxelBagFile from '../../assets/vox/bag.vox?url';
import voxelBranchFile from '../../assets/vox/branch.vox?url';
import voxelStickFile from '../../assets/vox/stick.vox?url';
import voxelStoneAxeFile from '../../assets/vox/stoneAxe.vox?url';
import voxelStonePickaxeFile from '../../assets/vox/stonePickaxe.vox?url';
import voxelStoneShovelFile from '../../assets/vox/stoneShovel.vox?url';
import voxelFistFile from '../../assets/vox/fist.vox?url';
import voxelCrabMeatRawFile from '../../assets/vox/crabMeatRaw.vox?url';

import voxelCrabIdle0File from '../../assets/vox/crab/idle_0.vox?url';
import voxelCrabIdle1File from '../../assets/vox/crab/idle_1.vox?url';
import voxelCrabWalk0File from '../../assets/vox/crab/walk_0.vox?url';
import voxelCrabWalk1File from '../../assets/vox/crab/walk_1.vox?url';
import voxelCrabAttack0File from '../../assets/vox/crab/attack_0.vox?url';
import voxelCrabAttack1File from '../../assets/vox/crab/attack_1.vox?url';

export interface CrabMesh {
    idle: VoxelMesh[];
    walk: VoxelMesh[];
    attack: VoxelMesh[];
}

export class MeshList {
    bag: VoxelMesh;
    branch: VoxelMesh;
    crabMeatRaw: VoxelMesh;
    fist: VoxelMesh;
    stick: VoxelMesh;
    stoneAxe: VoxelMesh;
    stonePickaxe: VoxelMesh;
    stoneShovel: VoxelMesh;

    crab: CrabMesh;

    blockType: TriangleMesh[] = [];
    gl: WebGL2RenderingContext;
    game: Game;

    generateBlockTypeMeshes() {
        this.blockType.length = 0;
        const tex = new Texture(
            this.gl,
            'blocks2D',
            this.game.blockTextureUrl,
            '2D'
        );
        for (let i = 0; i < this.game.world.blocks.length; i++) {
            const mesh = new TriangleMesh(tex);
            mesh.addBlockType(this.game.world.blocks[i]);
            mesh.finish();
            this.blockType[i] = mesh;
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
        this.branch = VoxelMesh.fromVoxFile(voxelBranchFile);
        this.fist = VoxelMesh.fromVoxFile(voxelFistFile);
        this.stick = VoxelMesh.fromVoxFile(voxelStickFile);
        this.crabMeatRaw = VoxelMesh.fromVoxFile(voxelCrabMeatRawFile);
        this.stoneAxe = VoxelMesh.fromVoxFile(voxelStoneAxeFile);
        this.stonePickaxe = VoxelMesh.fromVoxFile(voxelStonePickaxeFile);
        this.stoneShovel = VoxelMesh.fromVoxFile(voxelStoneShovelFile);
        this.crab = {
            idle: [
                VoxelMesh.fromVoxFile(voxelCrabIdle0File),
                VoxelMesh.fromVoxFile(voxelCrabIdle1File),
            ],
            walk: [
                VoxelMesh.fromVoxFile(voxelCrabWalk0File),
                VoxelMesh.fromVoxFile(voxelCrabWalk1File),
            ],
            attack: [
                VoxelMesh.fromVoxFile(voxelCrabAttack0File),
                VoxelMesh.fromVoxFile(voxelCrabAttack1File),
            ],
        };

        this.generateBlockTypeMeshes();
    }
}
