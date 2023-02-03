import { BlockMesh } from './meshes/blockMesh/blockMesh';
import { VoxelMesh } from './meshes/voxelMesh/voxelMesh';

export { BlockMesh } from './meshes/blockMesh/blockMesh';
export { VoxelMesh } from './meshes/voxelMesh/voxelMesh';

export const meshInit = (gl: WebGL2RenderingContext) => {
    BlockMesh.init(gl);
    VoxelMesh.init(gl);
};
