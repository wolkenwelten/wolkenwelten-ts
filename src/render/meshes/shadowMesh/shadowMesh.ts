// Wolkenwelten - Copyright (C) 2023 - Benjamin Vincent Schulenburg
// Licensed under an MIT License, see /LICENSE for the details
import { Shader } from '../../shader';
import { Texture } from '../../texture';
import { clamp } from '../../../util/math';
import shadowTextureUrl from '../../../../assets/gfx/shadow.png';

import shaderVertSource from './shadowMesh.vert?raw';
import shaderFragSource from './shadowMesh.frag?raw';
import { Game } from '../../../game';
import { mat4 } from 'gl-matrix';

export class ShadowMesh {
    static gl: WebGL2RenderingContext;
    static shader: Shader;
    static texture: Texture;
    game: Game;
    vertices: Float32Array;
    endOfBuffer = 0;
    elementCount = 0;

    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;

    static init(glc: WebGL2RenderingContext) {
        this.gl = glc;
        this.shader = new Shader(
            this.gl,
            'shadowMesh',
            shaderVertSource,
            shaderFragSource,
            ['cur_tex', 'mat_mvp']
        );
        this.texture = new Texture(this.gl, 'shadow', shadowTextureUrl, '2D');
        this.texture.linear();
    }

    constructor(game: Game) {
        this.game = game;
        this.vertices = new Float32Array(6 * 4 * 6 * 256);
        const vao = ShadowMesh.gl.createVertexArray();
        if (!vao) {
            throw new Error("Couldn't create VAO");
        }
        this.vao = vao;

        const vbo = ShadowMesh.gl.createBuffer();
        if (!vbo) {
            throw new Error("Can't create new textMesh vertex buffer!");
        }
        this.vbo = vbo;
    }

    private finish() {
        const gl = ShadowMesh.gl;
        gl.bindVertexArray(this.vao);

        const vertex_buffer = gl.createBuffer();
        if (!vertex_buffer) {
            throw new Error("Can't create new textMesh vertex buffer!");
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * 4, 0);
        gl.enableVertexAttribArray(0);

        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 6 * 4, 3 * 4);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribPointer(2, 1, gl.FLOAT, true, 6 * 4, 5 * 4);
        gl.enableVertexAttribArray(2);

        this.elementCount = this.endOfBuffer / 6;
        this.endOfBuffer = 0;
    }

    private addVert(
        x: number,
        y: number,
        z: number,
        u: number,
        v: number,
        lightness: number
    ) {
        this.vertices[this.endOfBuffer] = x;
        this.vertices[this.endOfBuffer + 1] = y;
        this.vertices[this.endOfBuffer + 2] = z;
        this.vertices[this.endOfBuffer + 3] = u;
        this.vertices[this.endOfBuffer + 4] = v;
        this.vertices[this.endOfBuffer + 5] = lightness;
        this.endOfBuffer += 6;
    }

    private addQuad(
        x: number,
        y: number,
        z: number,
        size: number,
        lightness: number
    ) {
        this.addVert(x - size, y, z - size, 0.0, 0.0, lightness);
        this.addVert(x + size, y, z + size, 1.0, 1.0, lightness);
        this.addVert(x + size, y, z - size, 1.0, 0.0, lightness);

        this.addVert(x + size, y, z + size, 1.0, 1.0, lightness);
        this.addVert(x - size, y, z - size, 0.0, 0.0, lightness);
        this.addVert(x - size, y, z + size, 0.0, 1.0, lightness);
    }

    add(x: number, y: number, z: number, size: number) {
        for (let offY = 0; offY < 8; offY++) {
            const cy = y - offY;
            if (this.game.world.isSolid(x, cy, z)) {
                const iy = Math.floor(cy) + 1;
                const d = clamp(Math.abs(iy - y) / 7, 0, 1);
                const lightness = 1 - d;
                const rSize = size * (d + 0.4);
                this.addQuad(x, iy, z, rSize, lightness);
                return;
            }
        }
    }

    draw(mat_mvp: mat4) {
        if (this.endOfBuffer === 0) {
            return;
        }
        const gl = ShadowMesh.gl;
        this.finish();
        ShadowMesh.shader.bind().uniform4fv('mat_mvp', mat_mvp);
        ShadowMesh.shader.bind().uniform1i('cur_tex', 3);
        ShadowMesh.texture.bind(3);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.depthMask(false);
        gl.polygonOffset(-8, -8);

        gl.drawArrays(gl.TRIANGLES, 0, this.elementCount);
        gl.disable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(0, 0);
        gl.depthMask(true);
    }
}
