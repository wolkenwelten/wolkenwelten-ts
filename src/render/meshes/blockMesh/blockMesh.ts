import '../../../types';
import { Shader } from '../../shader';
import { Texture } from '../../texture';
import { Chunk } from '../../../world/chunk/chunk';

import shaderVertSource from './block.vert?raw';
import shaderFragSource from './block.frag?raw';
import blockTextureUrl from '../../../../assets/gfx/blocks.png';
import { mat4 } from 'gl-matrix';
import { meshgenComplex } from '../meshgen';

export class BlockMesh {
    static gl: WebGL2RenderingContext;
    static indeces: WebGLBuffer;
    static shader: Shader;
    static texture: Texture;

    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly createdAt: number;
    lastUpdated = 0;
    elementCount = 0;
    sideSquareCount: number[] = [];
    sideStart: number[] = [];
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly chunk: Chunk;

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
            ['cur_tex', 'mat_mv', 'mat_mvp', 'trans_pos', 'alpha']
        );
        this.texture = new Texture(
            this.gl,
            'blocks',
            blockTextureUrl,
            '2DArray'
        );
        this.texture.nearest();
        this.indeces = this.generateIndexBuffer(32 * 32 * 32 * 6);
    }

    static fromChunk(chunk: Chunk): BlockMesh {
        const [vertices, sideSquareCount] = meshgenComplex(chunk);
        return new BlockMesh(vertices, sideSquareCount, chunk);
    }

    updateFromChunk(chunk: Chunk) {
        const [vertices, sideSquareCount] = meshgenComplex(chunk);
        this.update(vertices, sideSquareCount);
    }

    update(vertices: Uint8Array, sideSquareCount: number[]) {
        const gl = BlockMesh.gl;

        this.lastUpdated = this.chunk.lastUpdated;
        this.sideSquareCount = sideSquareCount;
        this.sideStart = [0, 0, 0, 0, 0, 0];
        for (let i = 1; i < 12; i++) {
            this.sideStart[i] =
                this.sideStart[i - 1] + this.sideSquareCount[i - 1];
        }
        for (let i = 0; i < 12; i++) {
            this.sideStart[i] *= 6 * 4;
            this.sideSquareCount[i] *= 6;
        }
        this.elementCount = this.sideStart[6] / 4;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, BlockMesh.indeces);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.vertexAttribIPointer(0, 3, gl.UNSIGNED_BYTE, 5, 0);
        gl.enableVertexAttribArray(0);

        gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_BYTE, 5, 3);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_BYTE, 5, 4);
        gl.enableVertexAttribArray(2);
    }

    constructor(vertices: Uint8Array, sideSquareCount: number[], chunk: Chunk) {
        this.x = chunk.x;
        this.y = chunk.y;
        this.z = chunk.z;
        this.createdAt = chunk.lastUpdated;
        this.chunk = chunk;
        const vao = BlockMesh.gl.createVertexArray();
        if (!vao) {
            throw new Error("Couldn't create VAO");
        }
        this.vao = vao;
        const vertex_buffer = BlockMesh.gl.createBuffer();
        if (!vertex_buffer) {
            throw new Error("Can't create new textMesh vertex buffer!");
        }
        this.vbo = vertex_buffer;
        this.update(vertices, sideSquareCount);
    }

    static bindShaderAndTexture(projection: mat4, modelView: mat4) {
        BlockMesh.shader.bind();
        const modelViewProjection = mat4.create();
        mat4.multiply(modelViewProjection, projection, modelView);
        BlockMesh.shader.uniform4fv('mat_mv', modelView);
        BlockMesh.shader.uniform4fv('mat_mvp', modelViewProjection);
        BlockMesh.shader.uniform1i('cur_tex', 1);
        BlockMesh.texture.bind(1);
    }

    drawFast(mask: number, alpha: number, sideOffset = 0) {
        BlockMesh.gl.bindVertexArray(this.vao);
        BlockMesh.shader.uniform3f('trans_pos', this.x, this.y, this.z);
        BlockMesh.shader.uniform1f('alpha', alpha);
        if (mask === 0) {
            return;
        } else {
            for (let i = 0; i < 6; i++) {
                if (
                    (mask & (1 << i)) === 0 ||
                    this.sideSquareCount[i + sideOffset] === 0
                ) {
                    continue;
                }
                BlockMesh.gl.drawElements(
                    BlockMesh.gl.TRIANGLES,
                    this.sideSquareCount[i + sideOffset],
                    BlockMesh.gl.UNSIGNED_INT,
                    this.sideStart[i + sideOffset]
                );
            }
        }
    }

    draw(projection: mat4, modelView: mat4, mask: number, alpha: number) {
        BlockMesh.bindShaderAndTexture(projection, modelView);
        this.drawFast(mask, alpha);
    }
}
