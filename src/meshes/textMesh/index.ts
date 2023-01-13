import "../../types";
import { Shader } from "../../shader";

let gl: WebGL2RenderingContext;
let shader: Shader;
import shaderVertSource from "./text.vert?raw";
import shaderFragSource from "./text.frag?raw";

export const textMeshInit = (glc: WebGL2RenderingContext) => {
    gl = glc;
    shader = new Shader(gl, 'textMesh', shaderVertSource, shaderFragSource);
}


export class TextMesh {
    vertices: number[];
    vao: WebGLVertexArrayObject;

    constructor () {
        this.vertices = [
            -0.5,0.5,
            -0.5,-0.5,
            0.5,-0.5,

            -0.5,0.5,
            0.5,-0.5,
            -0.5,-0.5,
        ];

        const vao = gl.createVertexArray();
        if(!vao){throw new Error("Couldn't create VAO");}
        gl.bindVertexArray(vao);

        const vertex_buffer = gl.createBuffer();
        if(!vertex_buffer){throw new Error("Can't create new textMesh vertex buffer!");}
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        const pos = gl.getAttribLocation(shader.program, "pos");
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pos);

        this.vao = vao;
    }

    draw () {
        shader.bind();
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    }
}