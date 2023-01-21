import '../../types';
import { Shader } from '../shader';
import { Texture } from '../texture';

import shaderVertSource from './textMesh/text.vert?raw';
import shaderFragSource from './textMesh/text.frag?raw';
import guiTextureUrl from '../../../assets/gfx/gui.png';
import { mat4 } from 'gl-matrix';

export class TextMesh {
    static gl: WebGL2RenderingContext;
    static shader: Shader;
    static texture: Texture;

    vertices: number[] = [];
    elementCount = 0;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    ready = false;

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
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);

        this.vao = vao;
        this.vbo = vertex_buffer;
    }

    finish() {
        const gl = TextMesh.gl;

        const float_arr = new Float32Array(this.vertices);
        const uint_arr = new Uint32Array(float_arr.buffer);
        for (let i = 4; i < this.vertices.length; i += 5) {
            uint_arr[i] = this.vertices[i];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, float_arr, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 5 * 4, 0);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 2 * 4);
        gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 5 * 4, 4 * 4);

        this.elementCount = this.vertices.length / 5;
        this.ready = true;
        this.vertices.length = 0;
    }

    draw(mat_mvp: mat4) {
        const gl = TextMesh.gl;
        TextMesh.shader.bind().uniform4fv('mat_mvp', mat_mvp);
        TextMesh.texture.bind();
        gl.bindVertexArray(this.vao);
        if (!this.ready) {
            this.finish();
        }
        gl.drawArrays(gl.TRIANGLES, 0, this.elementCount);
    }

    pushVertex(x: number, y: number, u: number, v: number, color: number) {
        this.ready = false;
        this.vertices.push(x, y, u, v, color);
        return this;
    }

    pushBox(
        x: number,
        y: number,
        w: number,
        h: number,

        u: number,
        v: number,
        uw: number,
        vh: number,
        
        rgba: number
    ) {
        this.pushVertex(x, y + h, u, v + vh, rgba)
            .pushVertex(x + w, y, u + uw, v, rgba)
            .pushVertex(x, y, u, v, rgba)
            .pushVertex(x + w, y, u + uw, v, rgba)
            .pushVertex(x, y + h, u, v + vh, rgba)
            .pushVertex(x + w, y + h, u + uw, v + vh, rgba);
        return this;
    }

    pushHeart(
        x: number,
        y: number,
        size: number,
        rgba: number,
        fill_state: number
    ) {
        const u = (128 - 20 + fill_state * 4) * (1 / 128);
        const v = 1 - (128 - 4) * (1 / 128);
        this.pushBox(x, y, size, size, u, v, 4, 4, rgba);
        return this;
    }

    pushGlyph(x: number, y: number, size: number, rgba: number, c: number) {
        const glyphWidth = 8 * size;

        if (x < -glyphWidth) {
            return this;
        }
        if (y < -glyphWidth) {
            return this;
        }
        if (c === 0 || c === 20 || c >= 128) {
            return this;
        }

        let u = (32 + (c & 0xf) * Math.min(size, 2)) * (1 / 128);
        let v = 1 - (((c >> 4) & 0xf) + 1) * Math.min(size, 2) * (1 / 128);

        this.pushBox(
            x,
            y,
            glyphWidth,
            glyphWidth,
            u,
            v,
            Math.min(size, 2) * (1 / 128),
            Math.min(size, 2) * (1 / 128),
            rgba
        );
        return this;
    }

    pushString(x: number, y: number, size: number, rgba: number, text: string) {
        const glyphWidth = 8 * size;
        for (let i = 0; i < text.length; i++) {
            const c = text.charCodeAt(i);
            const cx = x + i * glyphWidth;
            this.pushGlyph(cx, y, size, rgba, c);
        }
        return this;
    }
}
