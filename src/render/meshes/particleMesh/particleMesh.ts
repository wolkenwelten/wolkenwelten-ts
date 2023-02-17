/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { RenderManager } from '../../render';
import { Shader } from '../../shader';

import shaderVertSource from './particleMesh.vert?raw';
import shaderFragSource from './particleMesh.frag?raw';
import { mat4 } from 'gl-matrix';
import { BlockType } from '../../../world/blockType/blockType';

export class ParticleMesh {
    static gl: WebGL2RenderingContext;
    static shader: Shader;

    renderer: RenderManager;
    maxParticles: number;

    velocity: Float32Array;
    floatBuffer: Float32Array;
    uintBuffer: Uint32Array;
    particleCount = 0;

    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;

    static init(glc: WebGL2RenderingContext) {
        this.gl = glc;
        this.shader = new Shader(
            this.gl,
            'particleMesh',
            shaderVertSource,
            shaderFragSource,
            ['mat_mvp']
        );
    }

    constructor(renderer: RenderManager, maxParticles = 4096) {
        const gl = ParticleMesh.gl;

        this.renderer = renderer;
        this.maxParticles = maxParticles;

        this.velocity = new Float32Array(this.maxParticles * 4);
        this.floatBuffer = new Float32Array(this.maxParticles * 5);
        this.uintBuffer = new Uint32Array(this.floatBuffer.buffer);

        const vao = gl.createVertexArray();
        if (!vao) {
            throw new Error("Couldn't create ParticleMesh VAO");
        }
        this.vao = vao;

        const vbo = gl.createBuffer();
        if (!vbo) {
            throw new Error("Can't create new ParticleMesh vertex buffer!");
        }
        this.vbo = vbo;
    }

    private finish() {
        const gl = ParticleMesh.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            this.floatBuffer.slice(0, this.particleCount * 5),
            gl.DYNAMIC_DRAW
        );

        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 5 * 4, 0);
        gl.enableVertexAttribArray(0);

        gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, true, 5 * 4, 4 * 4);
        gl.enableVertexAttribArray(1);
    }

    add(
        x: number,
        y: number,
        z: number,
        size: number,
        color: number,
        vx: number,
        vy: number,
        vz: number,
        vs: number
    ) {
        const endOfBuffer = this.particleCount * 5;
        this.floatBuffer[endOfBuffer] = x;
        this.floatBuffer[endOfBuffer + 1] = y;
        this.floatBuffer[endOfBuffer + 2] = z;
        this.floatBuffer[endOfBuffer + 3] = size;
        this.uintBuffer[endOfBuffer + 4] = color;

        const endOfVelocity = this.particleCount * 4;
        this.velocity[endOfVelocity] = vx;
        this.velocity[endOfVelocity + 1] = vy;
        this.velocity[endOfVelocity + 2] = vz;
        this.velocity[endOfVelocity + 3] = vs;
        this.particleCount++;
    }

    fxBlockBreak(x: number, y: number, z: number, bt: BlockType) {
        for (let i = 0; i < 64; i++) {
            const cx = x + Math.random();
            const cy = y + Math.random();
            const cz = z + Math.random();
            const cs = 96 + Math.random() * 64;
            const cc = i < 32 ? bt.colorA : bt.colorB;
            const vx = (Math.random() - 0.5) * 0.04;
            const vy = Math.random() * 0.03;
            const vz = (Math.random() - 0.5) * 0.04;
            const vs = -12;
            this.add(cx, cy, cz, cs, cc, vx, vy, vz, vs);
        }
    }

    fxBlockMine(x: number, y: number, z: number, bt: BlockType) {
        for (let i = 0; i < 2; i++) {
            const cx = x + Math.random();
            const cy = y + Math.random();
            const cz = z + Math.random();
            const cs = 128;
            const cc = i < 1 ? bt.colorA : bt.colorB;
            const vx = (Math.random() - 0.5) * 0.06;
            const vy = Math.random() * 0.05;
            const vz = (Math.random() - 0.5) * 0.06;
            const vs = -12;
            this.add(cx, cy, cz, cs, cc, vx, vy, vz, vs);
        }
    }

    fxStrike(x: number, y: number, z: number) {
        for (let i = 0; i < 32; i++) {
            const cx = x + Math.random() - 0.5;
            const cy = y + Math.random() - 0.5;
            const cz = z + Math.random() - 0.5;
            const cs = 96 + Math.random() * 64;
            let cc = 0xff20c0e0;
            cc |= (Math.random() * 32) | 0;
            cc |= ((Math.random() * 16) | 0) << 8;
            cc |= ((Math.random() * 16) | 0) << 16;
            const vx = (Math.random() - 0.5) * 0.06;
            const vy = Math.random() * 0.05;
            const vz = (Math.random() - 0.5) * 0.06;
            const vs = -14;
            this.add(cx, cy, cz, cs, cc, vx, vy, vz, vs);
        }
    }

    fxDeath(x: number, y: number, z: number) {
        for (let i = 0; i < 96; i++) {
            const cx = x + Math.random() - 0.5;
            const cy = y + Math.random() - 0.5;
            const cz = z + Math.random() - 0.5;
            const cs = 96 + Math.random() * 64;
            let cc = 0xff0020e0;
            cc |= (Math.random() * 32) | 0;
            cc |= ((Math.random() * 32) | 0) << 8;
            cc |= ((Math.random() * 8) | 0) << 16;
            const vx = (Math.random() - 0.5) * 0.1;
            const vy = Math.random() * 0.08;
            const vz = (Math.random() - 0.5) * 0.1;
            const vs = -11;
            this.add(cx, cy, cz, cs, cc, vx, vy, vz, vs);
        }
    }

    private update() {
        for (let i = this.particleCount - 1; i >= 0; i--) {
            const bufOff = i * 5;
            const velOff = i * 4;
            this.floatBuffer[bufOff] += this.velocity[velOff];
            this.floatBuffer[bufOff + 1] += this.velocity[velOff + 1];
            this.floatBuffer[bufOff + 2] += this.velocity[velOff + 2];
            this.floatBuffer[bufOff + 3] += this.velocity[velOff + 3];
            this.velocity[velOff + 1] -= 0.001;
            if (this.floatBuffer[bufOff + 3] <= 0) {
                const endBufOff = (this.particleCount - 1) * 5;
                const endVelOff = (this.particleCount - 1) * 4;
                this.floatBuffer[bufOff] = this.floatBuffer[endBufOff];
                this.floatBuffer[bufOff + 1] = this.floatBuffer[endBufOff + 1];
                this.floatBuffer[bufOff + 2] = this.floatBuffer[endBufOff + 2];
                this.floatBuffer[bufOff + 3] = this.floatBuffer[endBufOff + 3];
                this.floatBuffer[bufOff + 4] = this.floatBuffer[endBufOff + 4];

                this.velocity[velOff] = this.velocity[endVelOff];
                this.velocity[velOff + 1] = this.velocity[endVelOff + 1];
                this.velocity[velOff + 2] = this.velocity[endVelOff + 2];
                this.velocity[velOff + 3] = this.velocity[endVelOff + 3];
                this.particleCount--;
            }
        }
    }

    draw(mat_mvp: mat4) {
        if (this.particleCount === 0) {
            return;
        }
        const gl = ParticleMesh.gl;
        this.update();
        this.finish();
        ParticleMesh.shader.bind().uniform4fv('mat_mvp', mat_mvp);
        gl.drawArrays(gl.POINTS, 0, this.particleCount);
    }
}
