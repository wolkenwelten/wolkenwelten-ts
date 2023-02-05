import { Game } from '../game';
import { BlockMesh } from './meshes/blockMesh/blockMesh';
import { TriangleMesh } from './meshes/triangleMesh/triangleMesh';
import { DecalMesh } from './meshes/decalMesh/decalMesh';
import { VoxelMesh } from './meshes/voxelMesh/voxelMesh';

export { BlockMesh } from './meshes/blockMesh/blockMesh';
export { TriangleMesh } from './meshes/triangleMesh/triangleMesh';
export { DecalMesh as ShadowMesh } from './meshes/decalMesh/decalMesh';
export { VoxelMesh } from './meshes/voxelMesh/voxelMesh';

export const meshInit = (game: Game, gl: WebGL2RenderingContext) => {
    BlockMesh.init(game, gl);
    TriangleMesh.init(gl);
    DecalMesh.init(gl);
    VoxelMesh.init(gl);
};
