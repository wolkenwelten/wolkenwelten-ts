/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from 'gl-matrix';

import shaderFragSource from './particleMesh.frag?raw';
import shaderVertSource from './particleMesh.vert?raw';

import type { BlockType } from '../../../world/blockType';
import type { RenderManager } from '../../render';
import { Shader } from '../../shader';

export class ParticleMesh {
	static gl: WebGL2RenderingContext;
	static shader: Shader;

	renderer: RenderManager;
	maxParticles: number;

	gravity: Float32Array;
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

	constructor(renderer: RenderManager, maxParticles = 32768) {
		const gl = ParticleMesh.gl;

		this.renderer = renderer;
		this.maxParticles = maxParticles;

		this.gravity = new Float32Array(this.maxParticles * 4);
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
		vs: number,
		gx: number,
		gy: number,
		gz: number,
		gs: number
	) {
		let i = this.particleCount;
		if (this.particleCount >= this.maxParticles) {
			i = Math.floor(Math.random() * (this.maxParticles - 1));
		} else {
			this.particleCount++;
		}
		const endOfBuffer = i * 5;
		this.floatBuffer[endOfBuffer] = x;
		this.floatBuffer[endOfBuffer + 1] = y;
		this.floatBuffer[endOfBuffer + 2] = z;
		this.floatBuffer[endOfBuffer + 3] = size;
		this.uintBuffer[endOfBuffer + 4] = color;

		const endOfVelocity = i * 4;
		this.velocity[endOfVelocity] = vx;
		this.velocity[endOfVelocity + 1] = vy;
		this.velocity[endOfVelocity + 2] = vz;
		this.velocity[endOfVelocity + 3] = vs;

		const endOfGravity = endOfVelocity;
		this.gravity[endOfGravity] = gx;
		this.gravity[endOfGravity + 1] = gy;
		this.gravity[endOfGravity + 2] = gz;
		this.gravity[endOfGravity + 3] = gs;
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
			this.add(cx, cy, cz, cs, cc, vx, vy, vz, vs, 0, -0.001, 0, 0);
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
			this.add(cx, cy, cz, cs, cc, vx, vy, vz, vs, 0, -0.001, 0, 0);
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
			this.add(cx, cy, cz, cs, cc, vx, vy, vz, vs, 0, -0.001, 0, 0);
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
			this.add(cx, cy, cz, cs, cc, vx, vy, vz, vs, 0, -0.001, 0, 0);
		}
	}

	fxJump(x: number, y: number, z: number) {
		for (let i = 0; i < 96; i++) {
			const ox = Math.random() - 0.5;
			const oz = Math.random() - 0.5;
			const cx = x + ox * 0.1;
			const cy = y - 0.5;
			const cz = z + oz * 0.1;
			const cs = 48 + ((Math.random() * 24) | 0);
			let cc = 0xff80c0e0;
			cc |= (Math.random() * 32) | 0;
			cc |= ((Math.random() * 16) | 0) << 8;
			cc |= ((Math.random() * 16) | 0) << 16;
			const vx = ox * 0.2;
			const vy = (Math.random() - 0.5) * 0.002;
			const vz = oz * 0.2;
			const vs = -2;
			this.add(cx, cy, cz, cs, cc, vx, vy, vz, vs, 0, -0.001, 0, 0);
		}
	}

	fxLand(x: number, y: number, z: number) {
		for (let i = 0; i < 32; i++) {
			const ox = Math.random() - 0.5;
			const oz = Math.random() - 0.5;
			const cx = x + ox * 0.1;
			const cy = y - 0.5;
			const cz = z + oz * 0.1;
			const cs = 32 + ((Math.random() * 16) | 0);
			let cc = 0xff80c0e0;
			cc |= (Math.random() * 32) | 0;
			cc |= ((Math.random() * 16) | 0) << 8;
			cc |= ((Math.random() * 16) | 0) << 16;
			const vx = ox * 0.2;
			const vy = (Math.random() - 0.5) * 0.002;
			const vz = oz * 0.2;
			const vs = -2;
			this.add(cx, cy, cz, cs, cc, vx, vy, vz, vs, 0, -0.001, 0, 0);
		}
	}

	private update() {
		for (let i = this.particleCount - 1; i >= 0; i--) {
			const bufOff = i * 5;
			const velOff = i * 4;
			const gOff = velOff;
			this.floatBuffer[bufOff] += this.velocity[velOff];
			this.floatBuffer[bufOff + 1] += this.velocity[velOff + 1];
			this.floatBuffer[bufOff + 2] += this.velocity[velOff + 2];
			this.floatBuffer[bufOff + 3] += this.velocity[velOff + 3];
			this.velocity[velOff] += this.gravity[gOff];
			this.velocity[velOff + 1] += this.gravity[gOff + 1];
			this.velocity[velOff + 2] += this.gravity[gOff + 2];
			this.velocity[velOff + 3] += this.gravity[gOff + 3];
			if (this.floatBuffer[bufOff + 3] <= 0) {
				const endBufOff = (this.particleCount - 1) * 5;
				const endVelOff = (this.particleCount - 1) * 4;
				const endGOff = endVelOff;
				this.floatBuffer[bufOff] = this.floatBuffer[endBufOff];
				this.floatBuffer[bufOff + 1] = this.floatBuffer[endBufOff + 1];
				this.floatBuffer[bufOff + 2] = this.floatBuffer[endBufOff + 2];
				this.floatBuffer[bufOff + 3] = this.floatBuffer[endBufOff + 3];
				this.uintBuffer[bufOff + 4] = this.uintBuffer[endBufOff + 4];

				this.velocity[velOff] = this.velocity[endVelOff];
				this.velocity[velOff + 1] = this.velocity[endVelOff + 1];
				this.velocity[velOff + 2] = this.velocity[endVelOff + 2];
				this.velocity[velOff + 3] = this.velocity[endVelOff + 3];

				this.gravity[gOff] = this.gravity[endGOff];
				this.gravity[gOff + 1] = this.gravity[endGOff + 1];
				this.gravity[gOff + 2] = this.gravity[endGOff + 2];
				this.gravity[gOff + 3] = this.gravity[endGOff + 3];

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
		gl.enable(gl.BLEND);
		gl.depthMask(false);
		gl.blendFunc(gl.ONE, gl.ONE);
		ParticleMesh.shader.bind().uniform4fv('mat_mvp', mat_mvp);
		gl.drawArrays(gl.POINTS, 0, this.particleCount);
		gl.depthMask(true);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	}
}
