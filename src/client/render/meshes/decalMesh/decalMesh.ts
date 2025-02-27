/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";

import shadowTextureUrl from "../../../../../assets/gfx/decals.png";
import shaderFragSource from "./decalMesh.frag?raw";
import shaderVertSource from "./decalMesh.vert?raw";

import type { RenderManager } from "../../render";
import { clamp } from "../../../../util/math";
import { Shader } from "../../shader";
import { Texture } from "../../texture";

const uvs = 1 / 8;

export class DecalMesh {
	static gl: WebGL2RenderingContext;
	static shader: Shader;
	static texture: Texture;
	renderer: RenderManager;
	vertices: Float32Array;
	endOfBuffer = 0;
	elementCount = 0;

	vao: WebGLVertexArrayObject;
	vbo: WebGLBuffer;

	static init(glc: WebGL2RenderingContext) {
		this.gl = glc;
		this.shader = new Shader(
			this.gl,
			"decalMesh",
			shaderVertSource,
			shaderFragSource,
			["cur_tex", "mat_mvp"],
		);
		this.texture = new Texture(this.gl, "decals", shadowTextureUrl, "2D");
		this.texture.linear();
	}

	constructor(renderer: RenderManager) {
		const gl = DecalMesh.gl;

		this.renderer = renderer;
		this.vertices = new Float32Array(6 * 4 * 6 * 256);
		const vao = gl.createVertexArray();
		if (!vao) {
			throw new Error("Couldn't create VAO");
		}
		this.vao = vao;

		const vbo = gl.createBuffer();
		if (!vbo) {
			throw new Error("Can't create new DecalMesh vertex buffer!");
		}
		this.vbo = vbo;
	}

	private finish() {
		const gl = DecalMesh.gl;
		gl.bindVertexArray(this.vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			this.vertices.slice(0, this.endOfBuffer),
			gl.DYNAMIC_DRAW,
		);

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
		lightness: number,
	) {
		this.vertices[this.endOfBuffer] = x;
		this.vertices[this.endOfBuffer + 1] = y;
		this.vertices[this.endOfBuffer + 2] = z;
		this.vertices[this.endOfBuffer + 3] = u;
		this.vertices[this.endOfBuffer + 4] = v;
		this.vertices[this.endOfBuffer + 5] = lightness;
		this.endOfBuffer += 6;
	}

	addTop(
		x: number,
		y: number,
		z: number,
		size: number,
		lightness: number,
		tx: number,
		ty: number,
	) {
		const u = tx * uvs;
		const v = ty * uvs;
		this.addVert(x - size, y, z - size, u, v, lightness);
		this.addVert(x + size, y, z + size, u + uvs, v + uvs, lightness);
		this.addVert(x + size, y, z - size, u + uvs, v, lightness);

		this.addVert(x + size, y, z + size, u + uvs, v + uvs, lightness);
		this.addVert(x - size, y, z - size, u, v, lightness);
		this.addVert(x - size, y, z + size, u, v + uvs, lightness);
	}

	addBottom(
		x: number,
		y: number,
		z: number,
		size: number,
		lightness: number,
		tx: number,
		ty: number,
	) {
		const u = tx * uvs;
		const v = ty * uvs;
		this.addVert(x - size, y, z - size, u, v, lightness);
		this.addVert(x + size, y, z - size, u + uvs, v, lightness);
		this.addVert(x + size, y, z + size, u + uvs, v + uvs, lightness);

		this.addVert(x + size, y, z + size, u + uvs, v + uvs, lightness);
		this.addVert(x - size, y, z + size, u, v + uvs, lightness);
		this.addVert(x - size, y, z - size, u, v, lightness);
	}

	addLeft(
		x: number,
		y: number,
		z: number,
		size: number,
		lightness: number,
		tx: number,
		ty: number,
	) {
		const u = tx * uvs;
		const v = ty * uvs;
		this.addVert(x, y - size, z - size, u, v, lightness);
		this.addVert(x, y + size, z + size, u + uvs, v + uvs, lightness);
		this.addVert(x, y + size, z - size, u + uvs, v, lightness);

		this.addVert(x, y + size, z + size, u + uvs, v + uvs, lightness);
		this.addVert(x, y - size, z - size, u, v, lightness);
		this.addVert(x, y - size, z + size, u, v + uvs, lightness);
	}

	addRight(
		x: number,
		y: number,
		z: number,
		size: number,
		lightness: number,
		tx: number,
		ty: number,
	) {
		const u = tx * uvs;
		const v = ty * uvs;
		this.addVert(x, y - size, z - size, u, v, lightness);
		this.addVert(x, y + size, z - size, u + uvs, v, lightness);
		this.addVert(x, y + size, z + size, u + uvs, v + uvs, lightness);

		this.addVert(x, y + size, z + size, u + uvs, v + uvs, lightness);
		this.addVert(x, y - size, z + size, u, v + uvs, lightness);
		this.addVert(x, y - size, z - size, u, v, lightness);
	}

	addFront(
		x: number,
		y: number,
		z: number,
		size: number,
		lightness: number,
		tx: number,
		ty: number,
	) {
		const u = tx * uvs;
		const v = ty * uvs;
		this.addVert(x - size, y - size, z, u, v, lightness);
		this.addVert(x + size, y + size, z, u + uvs, v + uvs, lightness);
		this.addVert(x + size, y - size, z, u + uvs, v, lightness);

		this.addVert(x + size, y + size, z, u + uvs, v + uvs, lightness);
		this.addVert(x - size, y - size, z, u, v, lightness);
		this.addVert(x - size, y + size, z, u, v + uvs, lightness);
	}

	addBack(
		x: number,
		y: number,
		z: number,
		size: number,
		lightness: number,
		tx: number,
		ty: number,
	) {
		const u = tx * uvs;
		const v = ty * uvs;
		this.addVert(x - size, y - size, z, u, v, lightness);
		this.addVert(x + size, y - size, z, u + uvs, v, lightness);
		this.addVert(x + size, y + size, z, u + uvs, v + uvs, lightness);

		this.addVert(x + size, y + size, z, u + uvs, v + uvs, lightness);
		this.addVert(x - size, y + size, z, u, v + uvs, lightness);
		this.addVert(x - size, y - size, z, u, v, lightness);
	}

	addShadow(x: number, y: number, z: number, size: number) {
		for (let offY = 0; offY < 8; offY++) {
			const cy = y - offY;
			if (this.renderer.game.world.isSolid(x, cy, z)) {
				const iy = Math.floor(cy) + 1;
				const d = clamp(Math.abs(iy - y) / 7, 0, 1);
				const lightness = 1 - d;
				const rSize = size * (d + 0.4);
				this.addTop(x, iy, z, rSize, lightness, 0, 1);
				return;
			}
		}
	}

	addBlock(x: number, y: number, z: number, tx: number, ty: number) {
		this.addTop(x + 0.5, y + 1, z + 0.5, 0.5, 1, tx, ty);
		this.addBottom(x + 0.5, y, z + 0.5, 0.5, 1, tx, ty);
		this.addFront(x + 0.5, y + 0.5, z, 0.5, 1, tx, ty);
		this.addBack(x + 0.5, y + 0.5, z + 1, 0.5, 1, tx, ty);
		this.addLeft(x, y + 0.5, z + 0.5, 0.5, 1, tx, ty);
		this.addRight(x + 1, y + 0.5, z + 0.5, 0.5, 1, tx, ty);
	}

	draw(mat_mvp: mat4) {
		if (this.endOfBuffer === 0) {
			return;
		}
		const gl = DecalMesh.gl;
		this.finish();
		DecalMesh.shader.bind().uniform4fv("mat_mvp", mat_mvp);
		DecalMesh.shader.bind().uniform1i("cur_tex", 3);
		DecalMesh.texture.bind(3);
		gl.enable(gl.POLYGON_OFFSET_FILL);
		gl.depthMask(false);
		gl.polygonOffset(-2, -2);

		gl.drawArrays(gl.TRIANGLES, 0, this.elementCount);
		gl.disable(gl.POLYGON_OFFSET_FILL);
		gl.polygonOffset(0, 0);
		gl.depthMask(true);
	}
}
