import '../../../types';
import { Shader } from '../../shader';
import { Texture } from '../../texture';
import { Chunk } from '../../../world/chunk';

import shaderVertSource from './block.vert?raw';
import shaderFragSource from './block.frag?raw';
import blockTextureUrl from '../../../../assets/gfx/blocks.png';
import { mat4 } from 'gl-matrix';
import { meshgen } from './meshgen';

export class BlockMesh {
    static gl: WebGL2RenderingContext;
    static indeces: WebGLBuffer;
    static shader: Shader;
    static texture: Texture;

    x: number;
    y: number;
    z: number;
    elementCount = 0;
    vao: WebGLVertexArrayObject;

    static generateIndexBuffer(squareCount: number) {
        const bufferSize = squareCount * 6;
        const buf = new Uint32Array(bufferSize);
        for (let i = 0; i < squareCount; i++) {
            const off = i * 6;
            const vOff = i * 4;
            buf[off] = vOff;
            buf[off + 1] = vOff + 1;
            buf[off + 2] = vOff + 2;

            buf[off + 3] = vOff + 2;
            buf[off + 4] = vOff + 3;
            buf[off + 5] = vOff;
        }
        const vbo = this.gl.createBuffer();
        if (!vbo) {
            throw new Error("Can't create new textMesh vertex buffer!");
        }
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, vbo);
        this.gl.bufferData(
            this.gl.ELEMENT_ARRAY_BUFFER,
            buf,
            this.gl.STATIC_DRAW
        );
        return vbo;
    }

    static init(glc: WebGL2RenderingContext) {
        this.gl = glc;
        this.shader = new Shader(
            this.gl,
            'blockMesh',
            shaderVertSource,
            shaderFragSource,
            ['cur_tex', 'mat_mv', 'mat_mvp', 'trans_pos']
        );
        this.texture = new Texture(this.gl, 'gui', blockTextureUrl, '2DArray');
        this.texture.nearest();
        this.indeces = this.generateIndexBuffer(32 * 32 * 32 * 6);
    }

    static fromChunk(chunk: Chunk): BlockMesh {
        return new BlockMesh(meshgen(chunk), chunk.x, chunk.y, chunk.z);
    }

    constructor(vertices: Uint8Array, x: number, y: number, z: number) {
        const gl = BlockMesh.gl;
        this.x = x;
        this.y = y;
        this.z = z;

        const vao = gl.createVertexArray();
        if (!vao) {
            throw new Error("Couldn't create VAO");
        }
        this.vao = vao;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, BlockMesh.indeces);

        const vertex_buffer = gl.createBuffer();
        if (!vertex_buffer) {
            throw new Error("Can't create new textMesh vertex buffer!");
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.vertexAttribIPointer(0, 3, gl.UNSIGNED_BYTE, 5, 0);
        gl.enableVertexAttribArray(0);

        gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_BYTE, 5, 3);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_BYTE, 5, 4);
        gl.enableVertexAttribArray(2);
        this.elementCount = ((vertices.length / 5)/4)*6;
    }

    static bindShaderAndTexture(projection: mat4, modelView: mat4) {
        BlockMesh.shader.bind();
        BlockMesh.shader.uniform4fv('mat_mv', modelView);
        const modelViewProjection = mat4.create();
        mat4.multiply(modelViewProjection, projection, modelView);
        BlockMesh.shader.uniform4fv('mat_mvp', modelViewProjection);
        BlockMesh.texture.bind();
    }

    drawFast() {
        BlockMesh.shader.uniform3f('trans_pos', this.x, this.y, this.z);
        BlockMesh.gl.bindVertexArray(this.vao);
        BlockMesh.gl.drawElements(
            BlockMesh.gl.TRIANGLES,
            this.elementCount,
            BlockMesh.gl.UNSIGNED_INT,
            0
        );
    }

    draw(projection: mat4, modelView: mat4) {
        BlockMesh.bindShaderAndTexture(projection, modelView);
        this.drawFast();
    }
}
