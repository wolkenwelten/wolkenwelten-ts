/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Sky renders two very simple primitives that together create the illusion of
 * a skybox: an inverted textured sphere for the sky gradient plus a billboarded
 * quad for the sun.  It is free of time-of-day logic; callers are expected to
 * swap textures or modify shader colouring if dynamic day/night cycles are
 * required.
 *
 * Implementation notes
 * --------------------
 * • Uses a large radius inverted sphere so that the near clipping plane never
 *   intersects the sky geometry, avoiding artefacts when the camera clips
 *   through.
 * • Depth writes are disabled during drawing to keep the sky always at the very
 *   back; depth test is also disabled so fragment processing is minimal.
 * • A separate `TriangleMesh` instance is used for the sun so blending can be
 *   toggled just for that draw call.
 *
 * Potential pitfalls
 * ------------------
 * • If you later introduce HDR or tonemapping, remember to render the sky last
 *   in LDR or account for exposure – otherwise the gradient will wash out.
 * • The sun quad is placed at a fixed position; animated suns should update the
 *   vertex buffer each frame or regenerate the mesh.
 */
import type { RenderManager } from "./render";
import { TriangleMesh } from "./meshes/triangleMesh/triangleMesh";
import { Texture } from "./texture";
import skyTextureUrl from "../../../assets/gfx/sky.png";
import sunTextureUrl from "../../../assets/gfx/sun.png";
import { mat4 } from "gl-matrix";

const mvp = mat4.create();

export class Sky {
	mesh: TriangleMesh;
	sunMesh: TriangleMesh;
	renderer: RenderManager;
	/**
	 * Creates textured meshes for the sky dome and sun, applying linear filtering
	 * so the low-res textures don't look blocky. Only lightweight CPU work is
	 * done here; GPU buffers are built inside `TriangleMesh.finish()`.
	 */
	constructor(renderer: RenderManager) {
		this.renderer = renderer;
		const skyTex = new Texture(renderer.gl, "sky", skyTextureUrl, "2D");
		skyTex.linear();
		this.mesh = new TriangleMesh(skyTex);
		this.mesh.addInverseSphere(500, 6); // Big radius for sky!
		this.mesh.finish();

		// Sun setup (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)
		const sunTex = new Texture(renderer.gl, "sun", sunTextureUrl, "2D");
		sunTex.linear();
		this.sunMesh = new TriangleMesh(sunTex);
		this.addSunPlane();
		this.sunMesh.finish();
	}

	/**
	 * Helper that appends vertices for a world-space oriented quad representing
	 * the sun. Coordinates are chosen so the quad is always above the camera in
	 * the positive Y direction.
	 */
	private addSunPlane() {
		// Add a square plane for the sun high in the sky
		const size = 50; // Size of the sun
		const y = 400; // Height of the sun

		// Define the vertices for a simple quad
		// Position (x, y, z), UV coordinates (u, v), and lightness
		this.sunMesh.vertices.push(
			-size,
			y,
			-size,
			0,
			0,
			1.0, // Top-left
			size,
			y,
			-size,
			1,
			0,
			1.0, // Top-right
			-size,
			y,
			size,
			0,
			1,
			1.0, // Bottom-left

			size,
			y,
			-size,
			1,
			0,
			1.0, // Top-right
			size,
			y,
			size,
			1,
			1,
			1.0, // Bottom-right
			-size,
			y,
			size,
			0,
			1,
			1.0, // Bottom-left
		);
	}

	/**
	 * Draws both sky and sun. Depth test/write are temporarily disabled so later
	 * world geometry isn't affected. Blending is enabled only for the sun to
	 * preserve correct alpha behaviour.
	 */
	draw(p: mat4, v: mat4) {
		mat4.multiply(mvp, p, v);
		const gl = this.renderer.gl;

		gl.disable(gl.DEPTH_TEST);
		gl.depthMask(false);

		// Draw sky dome
		this.mesh.draw(mvp);

		// Enable blending for the sun (✿◠‿◠)
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		this.sunMesh.draw(mvp);
		gl.disable(gl.BLEND);

		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);
	}
}
