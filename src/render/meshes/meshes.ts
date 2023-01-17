import { BlockMesh } from './blockMesh/blockMesh';
import { Mesh } from './mesh/mesh';
import { TextMesh } from './textMesh/textMesh';

export { BlockMesh } from './blockMesh/blockMesh';
export { Mesh } from './mesh/mesh';
export { TextMesh } from './textMesh/textMesh';

export const meshInit = (gl: WebGL2RenderingContext) => {
    BlockMesh.init(gl);
    Mesh.init(gl);
    TextMesh.init(gl);
};
