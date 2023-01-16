import '../../../types';
import { Shader } from '../../shader';
import { Texture } from '../../texture';

import shaderVertSource from './text.vert?raw';
import shaderFragSource from './text.frag?raw';
import guiTextureUrl from '../../../../assets/gfx/gui.png';
import { mat4 } from 'gl-matrix';

export class TextMesh {
    static gl: WebGL2RenderingContext;
    static shader: Shader;
    static texture: Texture;

    vertices: number[] = [];
    elementCount = 0;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;

    static init(glc: WebGL2RenderingContext) {
        this.gl = glc;
        this.shader = new Shader(
            this.gl,
            'textMesh',
            shaderVertSource,
            shaderFragSource,
            ['cur_tex', 'mat_mvp']
        );
        this.texture = new Texture(this.gl, 'gui', guiTextureUrl);
    }

    constructor() {
        const gl = TextMesh.gl;

        this.vertices = [
            0, 1024, 0, 0, 0xffffffff,

            1024, 0, 1, 1, 0xffffffff,

            0, 0, 0, 1, 0xffffffff,

            1024, 0, 1, 1, 0xffffffff,

            0, 1024, 0.0, 0.0, 0xffffffff,

            1024, 1024, 1, 0, 0xffffffff,
        ];

        const vao = gl.createVertexArray();
        if (!vao) {
            throw new Error("Couldn't create VAO");
        }
        gl.bindVertexArray(vao);

        const vertex_buffer = gl.createBuffer();
        if (!vertex_buffer) {
            throw new Error("Can't create new textMesh vertex buffer!");
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

        const float_arr = new Float32Array(this.vertices);
        const uint_arr = new Uint32Array(float_arr.buffer);
        for (let i = 4; i < this.vertices.length; i += 5) {
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
        this.vbo = vertex_buffer;
    }

    empty() {
        this.vertices = [];
    }

    draw(mat_mvp: mat4) {
        const gl = TextMesh.gl;
        TextMesh.shader.bind().uniform4fv('mat_mvp', mat_mvp);
        TextMesh.texture.bind();
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.elementCount);
    }
}
