import { BlockMesh } from './blockMesh';
import { Mesh } from './mesh';
import { TextMesh } from './textMesh';

export { BlockMesh } from './blockMesh';
export { Mesh } from './mesh';
export { TextMesh } from './textMesh';

export const meshInit = (gl: WebGL2RenderingContext) => {
    BlockMesh.init(gl);
    Mesh.init(gl);
    TextMesh.init(gl);
};
