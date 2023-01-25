import { BlockMesh } from './meshes/blockMesh';
import { Mesh } from './meshes/mesh';
import { VoxelMesh } from './meshes/voxelMesh';

export { BlockMesh } from './meshes/blockMesh';
export { Mesh } from './meshes/mesh';
export { VoxelMesh } from './meshes/voxelMesh';

export const meshInit = (gl: WebGL2RenderingContext) => {
    BlockMesh.init(gl);
    Mesh.init(gl);
    VoxelMesh.init(gl);
};
