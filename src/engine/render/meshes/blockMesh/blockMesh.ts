/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from 'gl-matrix';

import shaderFragSource from './blockMesh.frag?raw';
import shaderVertSource from './blockMesh.vert?raw';

import { Game } from '../../../game';
import { Chunk } from '../../../world/chunk/chunk';
import { Shader } from '../../shader';
import { Texture } from '../../texture';
import { meshgenChunk } from '../meshgen';

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
    sideElementCount: number[] = [];
    sideStart: number[] = [];

    /* Initialize all the static members necessary so that we can render blockMeshes. For example we load
     * textures and compile/link shaders here.
     */
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

    /* Create a new blockMesh with data from chunk. Can be quite slow. */
    static fromChunk(chunk: Chunk): BlockMesh {
        const [vertices, sideElementCount] = meshgenChunk(chunk);
        return new BlockMesh(vertices, sideElementCount, chunk);
    }

    /* Recreate a blockMesh with data from chunk. Doesn't check whether an update is
     * necessary, so be careful about callingthis too often since it can be quite slow.
     * Doesn't set this.lastUpdated, so that is something the caller needs to do so that
     * we don't end up generating the same mesh over and over again.
     */
    updateFromChunk(chunk: Chunk) {
        const [vertices, sideElementCount] = meshgenChunk(chunk);
        this.update(vertices, sideElementCount);
    }

    /* Update the buffers of an existing blockMesh, you probably don't want to call this directly,
     * instead prefer the updateFromChunk method.
     */
    private update(vertices: Uint8Array, sideElementCount: number[]) {
        const gl = BlockMesh.gl;

        this.lastUpdated = this.chunk.lastUpdated;
        this.sideElementCount = sideElementCount;
        this.sideStart = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 1; i < 12; i++) {
            this.sideStart[i] =
                this.sideStart[i - 1] + this.sideElementCount[i - 1];
        }
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

    /* Create a new blockMesh from the vertex data contained in vertices, you most likely
     * don't want to call this directly, instead calling the static method fromChunk to create a new
     * blockMesh for a specific chunk.
     */
    private constructor(
        vertices: Uint8Array,
        sideElementCount: number[],
        chunk: Chunk
    ) {
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
        this.update(vertices, sideElementCount);
    }

    /* This function sets all the uniforms that don't change from one chunk to another, like
     * the texture and such. This needs to be called before drawFast
     */
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

    /* Draw certain sides of a chunk, which sides are drawn depend on the bits within mask.
     * We're using drawArrays instead of drawElements because this way we use less memory,
     * don't have to worry about having enough indeces and at least on the RPI4 drawArrays
     * is slightly faster than drawArrays.
     */
    drawFast(mask: number, alpha: number, sideOffset = 0): number {
        const elementCount =
            this.sideStart[sideOffset + 5] +
            this.sideElementCount[sideOffset + 5];
        if (elementCount === 0 || mask === 0) {
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
