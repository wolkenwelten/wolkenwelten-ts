import { Game } from '../game';
import { BlockMesh } from './meshes/blockMesh/blockMesh';
import { TriangleMesh } from './meshes/triangleMesh/triangleMesh';
import { ShadowMesh } from './meshes/shadowMesh/shadowMesh';
import { VoxelMesh } from './meshes/voxelMesh/voxelMesh';

export { BlockMesh } from './meshes/blockMesh/blockMesh';
export { TriangleMesh } from './meshes/triangleMesh/triangleMesh';
export { ShadowMesh } from './meshes/shadowMesh/shadowMesh';
export { VoxelMesh } from './meshes/voxelMesh/voxelMesh';

export const meshInit = (game: Game, gl: WebGL2RenderingContext) => {
    BlockMesh.init(game, gl);
    TriangleMesh.init(gl);
    ShadowMesh.init(gl);
    VoxelMesh.init(gl);
};
