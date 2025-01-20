/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";

import shaderFragSource from "./triangleMesh.frag?raw";
import shaderVertSource from "./triangleMesh.vert?raw";

import "../../../types";
import type { BlockType } from "../../../world/blockType";
import type { Texture } from "../../texture";
import { Shader } from "../../shader";
import { WavefrontFile, WavefrontObject } from "./objLoader";

export class TriangleMesh {
	static gl: WebGL2RenderingContext;
	static shader: Shader;

	vertices: number[] = [];
	elementCount = 0;
	texture: Texture;
	vao: WebGLVertexArrayObject;
	finished = false;
	size = {
		x: 0,
		y: 0,
		z: 0,
	};

	static fromObjFile(objSource: string, tex: Texture): TriangleMesh {
		const mesh = new TriangleMesh(tex);
		const obj = new WavefrontFile(objSource);
		mesh.addObj(obj.objects[0]);
		mesh.finish();
		return mesh;
	}

	static init(glc: WebGL2RenderingContext) {
		this.gl = glc;
		this.shader = new Shader(
			this.gl,
			"textMesh",
			shaderVertSource,
			shaderFragSource,
			["cur_tex", "mat_mvp", "in_color"],
		);
	}

	constructor(texture: Texture) {
		const vao = TriangleMesh.gl.createVertexArray();
		if (!vao) {
			throw new Error("Couldn't create VAO");
		}
		this.vao = vao;
		this.texture = texture;
	}

	addObj(obj: WavefrontObject) {
		for (const f of obj.faces) {
			const pos = obj.positions[f.positionIndex];
			this.vertices.push(pos[0]);
			this.vertices.push(pos[1]);
			this.vertices.push(pos[2]);

			if (f.textureCoordinateIndex === undefined) {
				throw new Error("Missing texture coordinates");
			}
			const tex = obj.textureCoordinates[f.textureCoordinateIndex];
			this.vertices.push(tex[0]);
			this.vertices.push(1.0 - tex[1]); // Gotta flip them
			this.vertices.push(1.0); // Lightness
		}
	}

	addBlockType(bt: BlockType) {
		const m = -0.25;
		const p = 0.25;
		{
			const t = bt.texBack / 32;
			const z = t + 1 / 64;
			const l = 0.8;
			this.vertices.push(m, m, m, 0, t, l);
			this.vertices.push(p, p, m, 0.5, z, l);
			this.vertices.push(p, m, m, 0.5, t, l);

			this.vertices.push(p, p, m, 0.5, z, l);
			this.vertices.push(m, m, m, 0, t, l);
			this.vertices.push(m, p, m, 0, z, l);
		}
		{
			const t = bt.texFront / 32;
			const z = t + 1 / 64;
			const l = 0.8;
			this.vertices.push(m, m, p, 0, t, l);
			this.vertices.push(p, m, p, 0.5, t, l);
			this.vertices.push(p, p, p, 0.5, z, l);

			this.vertices.push(p, p, p, 0.5, z, l);
			this.vertices.push(m, p, p, 0, z, l);
			this.vertices.push(m, m, p, 0, t, l);
		}
		{
			const t = bt.texLeft / 32;
			const z = t + 1 / 64;
			const l = 0.8;
			this.vertices.push(m, m, m, 0, t, l);
			this.vertices.push(m, m, p, 0.5, t, l);
			this.vertices.push(m, p, p, 0.5, z, l);

			this.vertices.push(m, p, p, 0.5, z, l);
			this.vertices.push(m, p, m, 0, z, l);
			this.vertices.push(m, m, m, 0, t, l);
		}
		{
			const t = bt.texRight / 32;
			const z = t + 1 / 64;
			const l = 0.8;
			this.vertices.push(p, m, m, 0, t, l);
			this.vertices.push(p, p, p, 0.5, z, l);
			this.vertices.push(p, m, p, 0.5, t, l);

			this.vertices.push(p, p, p, 0.5, z, l);
			this.vertices.push(p, m, m, 0, t, l);
			this.vertices.push(p, p, m, 0, z, l);
		}
		{
			const t = bt.texTop / 32;
			const z = t + 1 / 64;
			const l = 1.0;
			this.vertices.push(m, p, m, 0, t, l);
			this.vertices.push(m, p, p, 0.5, t, l);
			this.vertices.push(p, p, p, 0.5, z, l);

			this.vertices.push(p, p, p, 0.5, z, l);
			this.vertices.push(p, p, m, 0, z, l);
			this.vertices.push(m, p, m, 0, t, l);
		}
		{
			const t = bt.texBottom / 32;
			const z = t + 1 / 64;
			const l = 0.6;
			this.vertices.push(m, m, m, 0, t, l);
			this.vertices.push(p, m, p, 0.5, z, l);
			this.vertices.push(m, m, p, 0.5, t, l);

			this.vertices.push(p, m, p, 0.5, z, l);
			this.vertices.push(m, m, m, 0, t, l);
			this.vertices.push(p, m, m, 0, z, l);
		}
	}

	addInverseSphere(radius: number = 100, segments: number = 12) {
		// We'll use fewer segments since it's a sky sphere and doesn't need high detail
		const latitudeBands = segments;
		const longitudeBands = segments * 2;

		for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
			for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
				// Calculate vertices for two triangles making up this quad
				const positions = [
					[latNumber, longNumber],
					[latNumber, longNumber + 1],
					[latNumber + 1, longNumber],
					[latNumber + 1, longNumber],
					[latNumber, longNumber + 1],
					[latNumber + 1, longNumber + 1],
				];

				for (const [lat, long] of positions) {
					const theta2 = (lat * Math.PI) / latitudeBands;
					const phi2 = (long * 2 * Math.PI) / longitudeBands;

					// Calculate vertex position (inverted for inside viewing)
					const x = -radius * Math.sin(theta2) * Math.cos(phi2);
					const y = -radius * Math.cos(theta2);
					const z = -radius * Math.sin(theta2) * Math.sin(phi2);

					// UV coordinates
					const u = long / longitudeBands;
					const v = lat / latitudeBands;

					// Add vertex data (position, UV, and lightness)
					this.vertices.push(x, y, z); // Position
					this.vertices.push(u, v); // UV coordinates
					this.vertices.push(1.0); // Lightness
				}
			}
		}
	}

	finish() {
		const gl = TriangleMesh.gl;

		gl.bindVertexArray(this.vao);

		const vertex_buffer = gl.createBuffer();
		if (!vertex_buffer) {
			throw new Error("Can't create new textMesh vertex buffer!");
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

		const float_arr = new Float32Array(this.vertices);
		gl.bufferData(gl.ARRAY_BUFFER, float_arr, gl.STATIC_DRAW);

		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * 4, 0);
		gl.enableVertexAttribArray(0);

		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 6 * 4, 3 * 4);
		gl.enableVertexAttribArray(1);

		gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 6 * 4, 5 * 4);
		gl.enableVertexAttribArray(2);
		this.finished = true;
		this.elementCount = this.vertices.length / 6;
	}

	draw(mat_mvp: mat4) {
		const gl = TriangleMesh.gl;
		if (!this.finished) {
			throw new Error("Trying to draw unfinished mesh");
		}
		TriangleMesh.shader
			.bind()
			.uniform4fv("mat_mvp", mat_mvp)
			.uniform4f("in_color", 1, 1, 1, 1);

		this.texture.bind();
		gl.bindVertexArray(this.vao);
		gl.drawArrays(gl.TRIANGLES, 0, this.elementCount);
	}
}
