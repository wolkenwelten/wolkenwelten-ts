import { BlockMesh } from './meshes/blockMesh';
import { Mesh } from './meshes/mesh';
import { TextMesh } from './meshes/textMesh';

export { BlockMesh } from './meshes/blockMesh';
export { Mesh } from './meshes/mesh';
export { TextMesh } from './meshes/textMesh';

export const meshInit = (gl: WebGL2RenderingContext) => {
    BlockMesh.init(gl);
    Mesh.init(gl);
    TextMesh.init(gl);
};
