import { Game } from '../game';
import { BlockMesh } from './meshes/blockMesh/blockMesh';
import { VoxelMesh } from './meshes/voxelMesh/voxelMesh';

export { BlockMesh } from './meshes/blockMesh/blockMesh';
export { VoxelMesh } from './meshes/voxelMesh/voxelMesh';

export const meshInit = (game: Game, gl: WebGL2RenderingContext) => {
    BlockMesh.init(game, gl);
    VoxelMesh.init(gl);
};
