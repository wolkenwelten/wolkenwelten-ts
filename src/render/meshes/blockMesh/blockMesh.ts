/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import '../../../types';
import { Shader } from '../../shader';
import { Texture } from '../../texture';
import { Chunk } from '../../../world/chunk/chunk';

import shaderVertSource from './blockMesh.vert?raw';
import shaderFragSource from './blockMesh.frag?raw';
import { mat4 } from 'gl-matrix';
import { meshgenComplex } from '../meshgen';
import { Game } from '../../../game';

export class BlockMesh {
    static gl: WebGL2RenderingContext;
    static shader: Shader;
    static texture: Texture;
    static mvp = mat4.create();

    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly createdAt: number;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly chunk: Chunk;
    lastUpdated = 0;
    elementCount = 0;
    sideElementCount: number[] = [];
    sideStart: number[] = [];

    static init(game: Game, glc: WebGL2RenderingContext) {
        this.gl = glc;
        this.shader = new Shader(
            this.gl,
            'blockMesh',
            shaderVertSource,
            shaderFragSource,
            [
                'cur_tex',
                'mat_mv',
                'mat_mvp',
                'trans_pos',
                'alpha',
                'fade_distance',
            ]
        );
        this.texture = new Texture(
            this.gl,
            'blocks',
            game.world.blockTextureUrl,
            '2DArray'
        );
        this.texture.nearest();
    }

    static fromChunk(chunk: Chunk): BlockMesh {
        const [vertices, sideElementCount] = meshgenComplex(chunk);
        return new BlockMesh(vertices, sideElementCount, chunk);
    }

    updateFromChunk(chunk: Chunk) {
        const [vertices, sideElementCount] = meshgenComplex(chunk);
        this.update(vertices, sideElementCount);
    }

    update(vertices: Uint8Array, sideElementCount: number[]) {
        const gl = BlockMesh.gl;

        this.lastUpdated = this.chunk.lastUpdated;
        this.sideElementCount = sideElementCount;
        this.sideStart = [0, 0, 0, 0, 0, 0];
        for (let i = 1; i < 12; i++) {
            this.sideStart[i] =
                this.sideStart[i - 1] + this.sideElementCount[i - 1];
        }
        this.elementCount = this.sideStart[6];
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribIPointer(0, 3, gl.UNSIGNED_BYTE, 5, 0);
        gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_BYTE, 5, 3);
        gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_BYTE, 5, 4);
    }

    constructor(vertices: Uint8Array, sideSquareCount: number[], chunk: Chunk) {
        this.x = chunk.x;
        this.y = chunk.y;
        this.z = chunk.z;
        this.createdAt = chunk.world.game.ticks;
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

    static bindShaderAndTexture(
        projection: mat4,
        modelView: mat4,
        renderDistance: number
    ) {
        BlockMesh.shader.bind();

        const modelViewProjection = BlockMesh.mvp;
        mat4.identity(modelViewProjection);
        mat4.multiply(modelViewProjection, projection, modelView);
        BlockMesh.shader.uniform4fv('mat_mv', modelView);
        BlockMesh.shader.uniform4fv('mat_mvp', modelViewProjection);
        BlockMesh.shader.uniform1i('cur_tex', 1);
        BlockMesh.shader.uniform1f('fade_distance', renderDistance);
        BlockMesh.texture.bind(1);
    }

    drawFast(mask: number, alpha: number, sideOffset = 0) {
        if (this.elementCount === 0 || mask === 0) {
            return 0;
        }
        BlockMesh.gl.bindVertexArray(this.vao);
        BlockMesh.shader.uniform3f('trans_pos', this.x, this.y, this.z);
        BlockMesh.shader.uniform1f('alpha', alpha);
        let calls = 0;

        let start = 0;
        let end = 0;
        for (let i = 0; i < 6; i++) {
            if ((mask & (1 << i)) === 0) {
                continue;
            }
            const curStart = this.sideStart[i + sideOffset];
            const curEnd = curStart + this.sideElementCount[i + sideOffset];
            if (curStart !== end) {
                if (end !== start) {
                    BlockMesh.gl.drawArrays(
                        BlockMesh.gl.TRIANGLES,
                        start,
                        end - start
                    );
                    calls++;
                }
                start = curStart;
            }
            end = curEnd;
        }
        if (end !== start) {
            BlockMesh.gl.drawArrays(BlockMesh.gl.TRIANGLES, start, end - start);
            calls++;
        }
        return calls;
    }
}
