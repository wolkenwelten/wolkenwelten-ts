/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";

import shaderFragSource from "./cloudMesh.frag?raw";
import shaderVertSource from "./cloudMesh.vert?raw";
import cloudTexture from "../../../../../assets/gfx/clouds.jpg";

import "../../../../types";
import { Texture } from "../../texture";
import { Shader } from "../../shader";

const mvp = mat4.create();

export class CloudMesh {
	static gl: WebGL2RenderingContext;
	static shader: Shader;
	static texture: Texture;

	vertices: number[] = [];
	elementCount = 0;
	vao: WebGLVertexArrayObject;
	finished = false;
	size = {
		x: 0,
		y: 0,
		z: 0,
	};

	static init(glc: WebGL2RenderingContext) {
		this.gl = glc;
		this.shader = new Shader(
			this.gl,
			"cloudMesh",
			shaderVertSource,
			shaderFragSource,
			["cur_tex", "mat_mvp", "color", "tex_offset"],
		);
		this.texture = new Texture(this.gl, "cloudTexture", cloudTexture, "2D");
		this.texture.linear();
		this.texture.repeat();
	}

	constructor() {
		const vao = CloudMesh.gl.createVertexArray();
		if (!vao) {
			throw new Error("Couldn't create VAO");
		}
		this.vao = vao;

		this.addCircle();
		this.finish();
	}

	private addCircle(radius = 512, segments = 24) {
		// Create vertices around the circle
		for (let i = 0; i < segments; i++) {
			const angle = (i / segments) * Math.PI * 2;
			const nextAngle = ((i + 1) / segments) * Math.PI * 2;

			// Current point
			const x1 = Math.cos(angle) * radius;
			const z1 = Math.sin(angle) * radius;

			// Next point
			const x2 = Math.cos(nextAngle) * radius;
			const z2 = Math.sin(nextAngle) * radius;

			// UV coordinates
			const u1 = (Math.cos(angle) + 1) * 0.5;
			const v1 = (Math.sin(angle) + 1) * 0.5;
			const u2 = (Math.cos(nextAngle) + 1) * 0.5;
			const v2 = (Math.sin(nextAngle) + 1) * 0.5;

			// Create triangle
			this.vertices.push(0, 0, 0, 0.5, 0.5); // Center
			this.vertices.push(x2, 0, z2, u2, v2); // Next point
			this.vertices.push(x1, 0, z1, u1, v1); // Current point
		}
	}

	finish() {
		const gl = CloudMesh.gl;

		gl.bindVertexArray(this.vao);

		const vertex_buffer = gl.createBuffer();
		if (!vertex_buffer) {
			throw new Error("Can't create new vertex buffer!");
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

		const float_arr = new Float32Array(this.vertices);
		gl.bufferData(gl.ARRAY_BUFFER, float_arr, gl.STATIC_DRAW);

		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * 4, 0);
		gl.enableVertexAttribArray(0);

		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
		gl.enableVertexAttribArray(1);

		this.finished = true;
		this.elementCount = this.vertices.length / 5;
	}

	draw(
		projectionMatrix: mat4,
		viewMatrix: mat4,
		x: number,
		y: number,
		z: number,
		color: [number, number, number, number],
	) {
		const gl = CloudMesh.gl;
		if (!this.finished) {
			throw new Error("Trying to draw unfinished mesh");
		}
		mat4.identity(mvp);
		mat4.translate(mvp, mvp, [x, y, z]);
		mat4.mul(mvp, viewMatrix, mvp);
		mat4.mul(mvp, projectionMatrix, mvp);

		const uoff = x / 512.0 / 2;
		const voff = z / 512.0 / 2;

		CloudMesh.shader
			.bind()
			.uniform4fv("mat_mvp", mvp)
			.uniform4f("color", ...color)
			.uniform2f("tex_offset", uoff, voff);

		CloudMesh.texture.bind();
		gl.bindVertexArray(this.vao);
		gl.drawArrays(gl.TRIANGLES, 0, this.elementCount);
	}

	drawLayers(
		projectionMatrix: mat4,
		viewMatrix: mat4,
		x: number,
		y: number,
		z: number,
	) {
		this.draw(projectionMatrix, viewMatrix, x, y - 30, z, [0.6, 0.2, 0.4, 1]);
		this.draw(projectionMatrix, viewMatrix, x, y - 28, z, [0.8, 0.5, 0.7, 0.9]);
		this.draw(projectionMatrix, viewMatrix, x, y - 26, z, [1, 0.8, 0.9, 0.8]);
		this.draw(projectionMatrix, viewMatrix, x, y - 24, z, [1, 1, 1, 0.7]);
	}
}
