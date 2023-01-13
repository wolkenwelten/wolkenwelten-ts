import { textMeshInit } from "./textMesh";

export { Mesh } from "./mesh";
export { TextMesh } from "./textMesh";

export const meshInit = (gl: WebGL2RenderingContext) => {
    textMeshInit(gl);
};