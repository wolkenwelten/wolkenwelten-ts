/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Shader is a minimal wrapper around a WebGL2Program that streamlines shader
 * creation, uniform location caching and type-safe setters. It deliberately
 * keeps the public surface small: compile & link once in the constructor, then
 * `bind()` and push uniforms each frame.
 *
 * Design goals
 * ------------
 * • Fail fast – any compilation/link error throws with the detailed GLSL log.
 * • Avoid repetitive `gl.getUniformLocation` calls by caching locations upfront.
 * • Chainable uniform setters for fluent code (e.g. `shader.bind().uniform1f(...)`).
 *
 * Usage pattern
 * -------------
 * ```ts
 * const shader = new Shader(gl, "myShader", vertSrc, fragSrc, [
 *   "mat_mvp", "color"
 * ]);
 * shader.bind().uniform4f("color", 1, 0, 0, 1);
 * ```
 *
 * Footguns & pitfalls
 * -------------------
 * • You MUST pass **every** uniform name you intend to use in the `uniforms`
 *   array; otherwise accessors will throw at runtime.
 * • `bind()` merely calls `gl.useProgram`; remember to set attribute pointers
 *   and enable vertex arrays afterwards.
 */
import { mat4 } from "gl-matrix";

export class Shader {
	readonly name: string;
	readonly program: WebGLProgram;
	readonly gl: WebGL2RenderingContext;
	uniforms: Map<string, WebGLUniformLocation> = new Map();

	/**
	 * Compiles vertex & fragment sources, links them and pre-caches uniform
	 * locations. Throws on any GLSL or link error with verbose console output.
	 */
	constructor(
		gl: WebGL2RenderingContext,
		name: string,
		vert: string,
		frag: string,
		uniforms: string[],
	) {
		this.name = name;

		const vertShader = gl.createShader(gl.VERTEX_SHADER);
		if (!vertShader) {
			throw new Error(`Can't create vertex shader for '${name}'`);
		}
		gl.shaderSource(vertShader, vert);
		gl.compileShader(vertShader);

		const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
		if (!fragShader) {
			throw new Error(`Can't create fragment shader for '${name}'`);
		}
		gl.shaderSource(fragShader, frag);
		gl.compileShader(fragShader);

		const program = gl.createProgram();
		if (!program) {
			throw new Error(`Can't create shader program for '${name}'`);
		}
		gl.attachShader(program, vertShader);
		gl.attachShader(program, fragShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error(gl.getProgramInfoLog(program));
			if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(vertShader));
				throw new Error(`Couldn't compile vertex shader ${name}`);
			}
			if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(fragShader));
				throw new Error(`Couldn't compile fragment shader ${name}`);
			}
			throw new Error(`Couldn't link shader ${name}`);
		}
		this.program = program;
		this.gl = gl;
		for (const u of uniforms) {
			const loc = gl.getUniformLocation(program, u);
			if (!loc) {
				throw new Error(
					`Couldn't determine location of uniform '${u}' for '${name}'`,
				);
			}
			this.uniforms.set(u, loc);
		}
	}

	/**
	 * Sets this program as current via `gl.useProgram`. Chainable.
	 */
	bind() {
		this.gl.useProgram(this.program);
		return this;
	}

	uniform1i(name: string, value: number) {
		const loc = this.uniforms.get(name);
		if (!loc) {
			throw new Error(
				`No uniform location stored for '${name}' for shader '${this.name}'`,
			);
		}
		this.gl.uniform1i(loc, value);
		return this;
	}

	uniform1f(name: string, value: number) {
		const loc = this.uniforms.get(name);
		if (!loc) {
			throw new Error(
				`No uniform location stored for '${name}' for shader '${this.name}'`,
			);
		}
		this.gl.uniform1f(loc, value);
		return this;
	}

	uniform2f(name: string, x: number, y: number) {
		const loc = this.uniforms.get(name);
		if (!loc) {
			throw new Error(
				`No uniform location stored for '${name}' for shader '${this.name}'`,
			);
		}
		this.gl.uniform2f(loc, x, y);
		return this;
	}

	uniform3f(name: string, x: number, y: number, z: number) {
		const loc = this.uniforms.get(name);
		if (!loc) {
			throw new Error(
				`No uniform location stored for '${name}' for shader '${this.name}'`,
			);
		}
		this.gl.uniform3f(loc, x, y, z);
		return this;
	}

	uniform4f(name: string, r: number, g: number, b: number, a: number) {
		const loc = this.uniforms.get(name);
		if (!loc) {
			throw new Error(
				`No uniform location stored for '${name}' for shader '${this.name}'`,
			);
		}
		this.gl.uniform4f(loc, r, g, b, a);
		return this;
	}

	uniform4fv(name: string, value: mat4) {
		const loc = this.uniforms.get(name);
		if (!loc) {
			throw new Error(
				`No uniform location stored for '${name}' for shader '${this.name}'`,
			);
		}
		this.gl.uniformMatrix4fv(loc, false, value);
		return this;
	}
}
