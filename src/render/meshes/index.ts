import { blockMeshInit } from "./blockMesh";
import { meshMeshInit } from "./mesh";
import { textMeshInit } from "./textMesh";

export { BlockMesh } from "./blockMesh";
export { Mesh } from "./mesh";
export { TextMesh } from "./textMesh";

export const meshInit = (gl: WebGL2RenderingContext) => {
    blockMeshInit(gl);
    meshMeshInit(gl);
    textMeshInit(gl);
};