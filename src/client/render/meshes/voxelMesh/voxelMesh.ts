/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, see /LICENSE for full text.
 *
 * VoxelMesh
 * ---------
 * Lightweight renderer for MagicaVoxel `.vox` assets.  The file is parsed on
 * the client, colours are lazily inserted into a 1-D LUT texture and the
 * geometry is triangulated with the same meshing code that is used for world
 * chunks.  Two vertex formats are supported: *tiny* (5 bytes per vertex) for
 * single models and *short* (8 bytes) when multiple models are merged with
 * per-vertex translations.
 */
import { mat4 } from "gl-matrix";
import readVox from "vox-reader";

import shaderFragSource from "./voxelMesh.frag?raw";
import shaderVertSource from "./voxelMesh.vert?raw";

import { Shader } from "../../shader";
import { Texture } from "../../texture";
import { meshgenVoxelMesh } from "../meshgen";
import { isClient } from "../../../../util/compat";

const tmpBlocks = new Uint8Array(32 * 32 * 32);

export interface VoxelMeshBlit {
	vertices: Uint8Array | Uint16Array;
	x: number;
	y: number;
	z: number;
}

export class VoxelMesh {
	static gl: WebGL2RenderingContext;
	static shader: Shader;
	static texture: Texture;
	static colorPalette: Map<number, number> = new Map();

	lastUpdated = 0;
	vertCount = 0;
	vertices: Uint8Array;
	readonly vao: WebGLVertexArrayObject;
	readonly vbo: WebGLBuffer;
	size = {
		x: 0,
		y: 0,
		z: 0,
	};

	static init(glc: WebGL2RenderingContext) {
		this.gl = glc;
		this.shader = new Shader(
			this.gl,
			"voxelMesh",
			shaderVertSource,
			shaderFragSource,
			["cur_tex", "mat_mvp", "alpha", "trans_pos"],
		);
		this.texture = new Texture(this.gl, "voxelLUT", "", "LUT");
		this.texture.nearest();
	}

	static colorLookup(c: number): number {
		const entry = this.colorPalette.get(c);
		if (entry !== undefined) {
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
		if (isClient()) {
			setTimeout(async () => {
				const data = new Uint8Array(await (await fetch(href)).arrayBuffer());
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
				mesh.size.x = size.x;
				mesh.size.y = size.z;
				mesh.size.z = size.y;
				const ox = 32 / 2 - Math.floor(size.x / 2);
				const oy = 32 / 2 - Math.floor(size.y / 2);
				const oz = 32 / 2 - Math.floor(size.z / 2);
				tmpBlocks.fill(0);
				for (const { x, y, z, i } of voxData.xyzi.values) {
					const off = (y + oy) * 32 * 32 + (z + oz) * 32 + (x + ox);
					const c = voxData.rgba.values[i - 1];
					const rgb = c.r | (c.g << 8) | (c.b << 16);
					tmpBlocks[off] = VoxelMesh.colorLookup(rgb);
				}

				const [vertices, vertCount] = meshgenVoxelMesh(tmpBlocks);
				mesh.updateTiny(vertices, vertCount);
			}, 0);
		}
		return mesh;
	}

	updateTiny(vertices: Uint8Array, elementCount: number) {
		const gl = VoxelMesh.gl;
		this.vertCount = elementCount;
		this.vertices = vertices.slice();
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

	updateShort(vertices: Uint8Array, elementCount: number) {
		const gl = VoxelMesh.gl;
		this.vertCount = elementCount;
		gl.bindVertexArray(this.vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			vertices.slice(0, elementCount * 8),
			gl.STATIC_DRAW,
		);
		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);
		gl.enableVertexAttribArray(2);

		gl.vertexAttribIPointer(0, 3, gl.UNSIGNED_SHORT, 8, 0);
		gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_BYTE, 8, 6);
		gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_BYTE, 8, 7);
	}

	updateFromMultiple(blits: VoxelMeshBlit[], ticks: number) {
		let overallLength = 0;
		for (const blit of blits) {
			// We need to increase the size of the position attribute because we need 32*32 distinct values
			overallLength += (blit.vertices.length / 5) * 8;
			if (!(blit.vertices instanceof Uint8Array)) {
				throw new Error("Expected Uint8 vertex buffer");
			}
			if (blit.vertices.length === 0) {
				// This means a mesh isn't loaded yet, so we just abort the overall blitting since it'll most likely
				// be loaded in a couple of frames
				return;
			}
		}
		const buffer = new Uint8Array(overallLength);
		const shorts = new Uint16Array(buffer.buffer);
		let i = 0;
		for (const blit of blits) {
			// Now we combine all the vertex buffer into a single one with all vertices translated
			for (let ii = 0; ii < blit.vertices.length / 5; ii++) {
				shorts[i * 4] = blit.vertices[ii * 5] + blit.x;
				shorts[i * 4 + 1] = blit.vertices[ii * 5 + 1] + blit.y;
				shorts[i * 4 + 2] = blit.vertices[ii * 5 + 2] + blit.z;

				buffer[i * 8 + 6] = blit.vertices[ii * 5 + 3];
				buffer[i * 8 + 7] = blit.vertices[ii * 5 + 4];
				i++;
			}
		}
		const vertCount = overallLength / 8;
		this.lastUpdated = ticks;
		this.updateShort(buffer, vertCount);
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
		this.vertices = new Uint8Array(0);
	}

	draw(modelViewProjection: mat4, alpha: number, x = 0, y = 0, z = 0) {
		if (this.vertCount === 0) {
			return;
		}
		const gl = VoxelMesh.gl;

		VoxelMesh.shader.bind();
		VoxelMesh.shader.uniform4fv("mat_mvp", modelViewProjection);
		VoxelMesh.shader.uniform3f("trans_pos", x, y, z);
		VoxelMesh.shader.uniform1i("cur_tex", 2);
		VoxelMesh.shader.uniform1f("alpha", alpha);
		VoxelMesh.texture.bind(2);

		gl.bindVertexArray(this.vao);
		gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
	}
}
