import { BlockMesh } from './meshes/blockMesh';
import { VoxelMesh } from './meshes/voxelMesh';

export { BlockMesh } from './meshes/blockMesh';
export { VoxelMesh } from './meshes/voxelMesh';

export const meshInit = (gl: WebGL2RenderingContext) => {
    BlockMesh.init(gl);
    VoxelMesh.init(gl);
};
