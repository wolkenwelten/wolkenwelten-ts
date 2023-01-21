import { BlockMesh } from './meshes/blockMesh';
import { Mesh } from './meshes/mesh';

export { BlockMesh } from './meshes/blockMesh';
export { Mesh } from './meshes/mesh';

export const meshInit = (gl: WebGL2RenderingContext) => {
    BlockMesh.init(gl);
    Mesh.init(gl);
};
