import "../../../types";
import { Shader } from "../../shader";
import { Texture } from "../../texture";

let gl: WebGL2RenderingContext;
let shader: Shader;
let texture: Texture;

import shaderVertSource from "./text.vert?raw";
import shaderFragSource from "./text.frag?raw";
import guiTextureUrl from "../../../../assets/gfx/gui.png";
import { mat4, ReadonlyMat4 } from "gl-matrix";

export const textMeshInit = (glc: WebGL2RenderingContext) => {
    gl = glc;
    shader = new Shader(gl, 'textMesh', shaderVertSource, shaderFragSource, ["cur_tex", "mat_mvp"]);
    texture = new Texture(gl, 'gui', guiTextureUrl);
};

export class TextMesh {
    vertices: number[];
    elementCount: number;
    vao: WebGLVertexArrayObject;

    constructor () {
        this.vertices = [
            0, 1024,
            0, 0,
            0xFFFFFFFF,

            1024, 0,
            1, 1,
            0xFFFFFFFF,

            0, 0,
            0, 1,
            0xFFFFFFFF,


            1024, 0,
            1, 1,
            0xFFFFFFFF,

            0, 1024,
            0.0, 0.0,
            0xFFFFFFFF,

            1024, 1024,
            1, 0,
            0xFFFFFFFF,
        ];

        const vao = gl.createVertexArray();
        if(!vao){throw new Error("Couldn't create VAO");}
        gl.bindVertexArray(vao);

        const vertex_buffer = gl.createBuffer();
        if(!vertex_buffer){throw new Error("Can't create new textMesh vertex buffer!");}
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

        const float_arr = new Float32Array(this.vertices);
        const uint_arr = new Uint32Array(float_arr.buffer);
        for (let i=4;i<this.vertices.length;i+=5) {
            uint_arr[i] = this.vertices[i];
        }
        gl.bufferData(gl.ARRAY_BUFFER, float_arr, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 5 * 4, 0);
        gl.enableVertexAttribArray(0);

        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 2 * 4);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 5 * 4, 4 * 4);
        gl.enableVertexAttribArray(2);

        this.elementCount = this.vertices.length / 5;
        this.vao = vao;
    }

    draw (mat_mvp: mat4) {
        shader.bind();
        shader.uniform4fv("mat_mvp", mat_mvp);
        texture.bind();
        gl.bindVertexArray(this.vao);

        gl.drawArrays(gl.TRIANGLES, 0, this.elementCount);
    }
}