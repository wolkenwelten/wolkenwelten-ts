import "../../../types";
import { Shader } from "../../shader";
import { Texture } from "../../texture";
import { Chunk } from "../../../world/chunk";

let gl: WebGL2RenderingContext;
export let shader: Shader;
export let texture: Texture;

import shaderVertSource from "./block.vert?raw";
import shaderFragSource from "./block.frag?raw";
import blockTextureUrl from "../../../../assets/gfx/blocks.png";
import { mat4 } from "gl-matrix";
import { meshgen } from "./meshgen";

export const blockMeshInit = (glc: WebGL2RenderingContext) => {
    gl = glc;
    shader = new Shader(gl, 'blockMesh', shaderVertSource, shaderFragSource, ["cur_tex", "mat_mvp"]);
    texture = new Texture(gl, 'gui', blockTextureUrl, '2DArray');
    texture.nearest();
};

export const chunkIntoMesh = (chunk: Chunk):BlockMesh => new BlockMesh(meshgen(chunk));

export class BlockMesh {
    elementCount = 0;
    vao: WebGLVertexArrayObject;

    constructor (vertices: Uint8Array) {
        const vao = gl.createVertexArray();
        if(!vao){throw new Error("Couldn't create VAO");}
        this.vao = vao;
        gl.bindVertexArray(this.vao);

        const vertex_buffer = gl.createBuffer();
        if(!vertex_buffer){throw new Error("Can't create new textMesh vertex buffer!");}
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.vertexAttribIPointer(0, 3, gl.UNSIGNED_BYTE, 5, 0);
        gl.enableVertexAttribArray(0);

        gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_BYTE, 5, 3);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_BYTE, 5, 4);
        gl.enableVertexAttribArray(2);
        this.elementCount = vertices.length / 5;
    }

    draw (projection: mat4, modelView: mat4) {
        shader.bind();
        //shader.uniform4fv("mat_mv", modelView);
        const modelViewProjection = mat4.create();
        mat4.multiply(modelViewProjection, projection, modelView);
        shader.uniform4fv("mat_mvp", modelViewProjection);
        texture.bind();
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.elementCount);
    }
}