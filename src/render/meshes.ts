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

export const meshInit = (game: Game, gl: WebGL2RenderingContext) => {
    BlockMesh.init(game, gl);
    DecalMesh.init(gl);
    TriangleMesh.init(gl);
    ParticleMesh.init(gl);
    VoxelMesh.init(gl);
};
