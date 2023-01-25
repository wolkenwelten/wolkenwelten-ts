import '../../types';
import { Shader } from '../shader';
import { Texture } from '../texture';

import shaderVertSource from './voxelMesh/voxel.vert?raw';
import shaderFragSource from './voxelMesh/voxel.frag?raw';
import { mat4 } from 'gl-matrix';
import { BlockMesh } from './blockMesh';
import { meshgenSimple } from './blockMesh/meshgen';
import readVox from 'vox-reader';

const tmpBlocks = new Uint8Array(32 * 32 * 32);

export class VoxelMesh {
    static gl: WebGL2RenderingContext;
    static shader: Shader;
    static texture: Texture;
    static colorPalette: Map<number, number> = new Map();

    elementCount = 0;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;

    static init(glc: WebGL2RenderingContext) {
        this.gl = glc;
        this.shader = new Shader(
            this.gl,
            'voxelMesh',
            shaderVertSource,
            shaderFragSource,
            ['cur_tex', 'mat_mv', 'mat_mvp', 'alpha']
        );
        this.texture = new Texture(this.gl, 'voxelLUT', '', 'LUT');
        this.texture.nearest();
    }

    static colorLookup(c: number): number {
        const entry = this.colorPalette.get(c);
        if (entry) {
            return entry;
        } else {
            const i = this.colorPalette.size + 1;
            this.colorPalette.set(c, i);
            this.texture.setLUTEntry(i, c);
            return i;
        }
    }

    static fromVoxFile(href: string): VoxelMesh {
        const mesh = new VoxelMesh();
        setTimeout(async () => {
            const data = new Uint8Array(
                await (await fetch(href)).arrayBuffer()
            );
            const voxData = readVox(data);
            const size = voxData.size;
            if (
                size.x > 32 ||
                size.y > 32 ||
                size.z > 32 ||
                size.x <= 0 ||
                size.y <= 0 ||
                size.z <= 0
            ) {
                throw new Error(`Invalid .vox file: ${href}`);
            }
            const ox = 32 / 2 - Math.floor(size.x / 2);
            const oy = 32 / 2 - Math.floor(size.y / 2);
            const oz = 32 / 2 - Math.floor(size.z / 2);
            tmpBlocks.fill(0);
            for (const { x, y, z, i } of voxData.xyzi.values) {
                const off = (y + oy) * 32 * 32 + (x + ox) + (z + oz) * 32;
                const c = voxData.rgba.values[i];
                const cc = c.r | (c.g << 8) | (c.b << 16) | (c.a << 24);
                tmpBlocks[off] = VoxelMesh.colorLookup(cc);
            }
            const [vertices, elementCount] = meshgenSimple(tmpBlocks);
            mesh.update(vertices, elementCount);
        }, 0);
        return mesh;
    }

    update(vertices: Uint8Array, elementCount: number) {
        const gl = VoxelMesh.gl;
        this.elementCount = elementCount * 6;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, BlockMesh.indeces);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribIPointer(0, 3, gl.UNSIGNED_BYTE, 5, 0);
        gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_BYTE, 5, 3);
        gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_BYTE, 5, 4);
    }

    constructor() {
        const gl = VoxelMesh.gl;
        const vao = gl.createVertexArray();
        if (!vao) {
            throw new Error("Couldn't create VAO");
        }
        this.vao = vao;
        const vertex_buffer = gl.createBuffer();
        if (!vertex_buffer) {
            throw new Error("Can't create new textMesh vertex buffer!");
        }
        this.vbo = vertex_buffer;
    }

    draw(projection: mat4, modelView: mat4, alpha: number) {
        if (this.elementCount === 0) {
            return;
        }
        const gl = VoxelMesh.gl;
        const modelViewProjection = mat4.create();
        mat4.multiply(modelViewProjection, projection, modelView);

        VoxelMesh.shader.bind();
        VoxelMesh.shader.uniform4fv('mat_mv', modelView);
        VoxelMesh.shader.uniform4fv('mat_mvp', modelViewProjection);
        VoxelMesh.shader.uniform1i('cur_tex', 2);
        VoxelMesh.shader.uniform1f('alpha', alpha);
        VoxelMesh.texture.bind(2);

        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.elementCount, gl.UNSIGNED_INT, 0);
    }
}
