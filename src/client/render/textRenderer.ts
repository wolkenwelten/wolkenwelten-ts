/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";
import { Shader } from "./shader";

// Simple billboard vertex shader
const billboardVertSource = `#version 300 es
precision mediump float;

uniform mat4 mat_mvp;
uniform mat4 view_matrix;
uniform vec3 billboard_pos;
uniform vec2 billboard_size;

layout (location=0) in vec2 pos;
layout (location=1) in vec2 uv;

out vec2 tex_coord;

void main() {
    // Create billboard that always faces the camera
    // Extract right and up vectors from the view matrix
    vec3 right = normalize(vec3(view_matrix[0][0], view_matrix[1][0], view_matrix[2][0]));
    vec3 up = normalize(vec3(view_matrix[0][1], view_matrix[1][1], view_matrix[2][1]));
    
    vec3 world_pos = billboard_pos + 
                     right * (pos.x * billboard_size.x) + 
                     up * (pos.y * billboard_size.y);
    
    tex_coord = uv;
    gl_Position = mat_mvp * vec4(world_pos, 1.0);
}`;

// Simple textured fragment shader
const billboardFragSource = `#version 300 es
precision mediump float;

uniform sampler2D text_texture;
uniform float alpha;

in vec2 tex_coord;
out vec4 fragColor;

void main() {
    vec4 texColor = texture(text_texture, tex_coord);
    fragColor = vec4(texColor.rgb, texColor.a * alpha);
}`;

export class TextRenderer {
	static gl: WebGL2RenderingContext;
	static shader: Shader;

	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private textureCache: Map<string, WebGLTexture> = new Map();
	private vao!: WebGLVertexArrayObject;
	private vbo!: WebGLBuffer;

	static init(gl: WebGL2RenderingContext) {
		this.gl = gl;
		this.shader = new Shader(
			gl,
			"billboard",
			billboardVertSource,
			billboardFragSource,
			[
				"mat_mvp",
				"view_matrix",
				"billboard_pos",
				"billboard_size",
				"text_texture",
				"alpha",
			],
		);
	}

	constructor() {
		if (!TextRenderer.gl) {
			throw new Error(
				"TextRenderer not initialized! Call TextRenderer.init() first.",
			);
		}

		// Create canvas for text rendering
		this.canvas = document.createElement("canvas");
		this.canvas.width = 256;
		this.canvas.height = 64;
		const ctx = this.canvas.getContext("2d");
		if (!ctx) {
			throw new Error("Could not get 2D context from canvas");
		}
		this.ctx = ctx;

		// Setup WebGL resources
		this.setupWebGLResources();
	}

	private setupWebGLResources() {
		const gl = TextRenderer.gl;

		// Create VAO and VBO for a simple quad
		const vao = gl.createVertexArray();
		if (!vao) {
			throw new Error("Could not create VAO for text renderer");
		}
		this.vao = vao;

		const vbo = gl.createBuffer();
		if (!vbo) {
			throw new Error("Could not create VBO for text renderer");
		}
		this.vbo = vbo;

		gl.bindVertexArray(this.vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

		// Quad vertices (position + UV)
		// Two triangles making a quad, with origin at center
		const vertices = new Float32Array([
			// Triangle 1
			-0.5,
			0.5,
			0.0,
			0.0, // Top-left
			-0.5,
			-0.5,
			0.0,
			1.0, // Bottom-left
			0.5,
			0.5,
			1.0,
			0.0, // Top-right

			// Triangle 2
			0.5,
			0.5,
			1.0,
			0.0, // Top-right
			-0.5,
			-0.5,
			0.0,
			1.0, // Bottom-left
			0.5,
			-0.5,
			1.0,
			1.0, // Bottom-right
		]);

		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		// Position attribute (location 0)
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 4 * 4, 0);
		gl.enableVertexAttribArray(0);

		// UV attribute (location 1)
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 4 * 4, 2 * 4);
		gl.enableVertexAttribArray(1);

		gl.bindVertexArray(null);
	}

	private renderTextToCanvas(
		text: string,
		fontSize: number = 24,
		color: string = "#FFFFFF",
	): void {
		const ctx = this.ctx;

		// Clear canvas with transparent background
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Setup text rendering
		ctx.font = `bold ${fontSize}px Arial`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		// Add text outline for better visibility
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 3;
		ctx.strokeText(text, this.canvas.width / 2, this.canvas.height / 2);

		// Fill text
		ctx.fillStyle = color;
		ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
	}

	getTextTexture(
		text: string,
		fontSize: number = 24,
		color: string = "#FFFFFF",
	): WebGLTexture {
		const key = `${text}_${fontSize}_${color}`;

		// Check cache first
		let texture = this.textureCache.get(key);
		if (texture) {
			return texture;
		}

		// Render text to canvas
		this.renderTextToCanvas(text, fontSize, color);

		// Create WebGL texture from canvas
		const gl = TextRenderer.gl;
		const webglTexture = gl.createTexture();
		if (!webglTexture) {
			throw new Error("Could not create WebGL texture");
		}

		gl.bindTexture(gl.TEXTURE_2D, webglTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			this.canvas,
		);

		// Set texture parameters
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		// Cache it
		this.textureCache.set(key, webglTexture);

		return webglTexture;
	}

	drawTextBillboard(
		projectionMatrix: mat4,
		viewMatrix: mat4,
		text: string,
		x: number,
		y: number,
		z: number,
		scale: number = 1.0,
		alpha: number = 1.0,
		depthTest: boolean = false,
	): void {
		const gl = TextRenderer.gl;
		const texture = this.getTextTexture(text);

		// Calculate MVP matrix
		const mvp = mat4.create();
		mat4.multiply(mvp, projectionMatrix, viewMatrix);

		// Configure depth testing
		if (depthTest) {
			gl.enable(gl.DEPTH_TEST);
			gl.depthMask(false); // Still don't write to depth buffer, but read from it
		} else {
			gl.disable(gl.DEPTH_TEST); // Always render on top
		}

		// Enable blending for transparency
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// Bind shader and set uniforms
		TextRenderer.shader.bind();
		TextRenderer.shader.uniform4fv("mat_mvp", mvp);
		TextRenderer.shader.uniform4fv("view_matrix", viewMatrix);
		TextRenderer.shader.uniform3f("billboard_pos", x, y, z);
		TextRenderer.shader.uniform2f("billboard_size", scale, scale * 0.25); // Make text wider than tall
		TextRenderer.shader.uniform1f("alpha", alpha);
		TextRenderer.shader.uniform1i("text_texture", 0);

		// Bind texture and VAO
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.bindVertexArray(this.vao);

		// Draw the billboard
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// Cleanup - restore depth testing state
		gl.bindVertexArray(null);
		gl.enable(gl.DEPTH_TEST);
		gl.depthMask(true);
		gl.disable(gl.BLEND);
	}
}
