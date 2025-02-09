import type { RenderManager } from "./render";
import { TriangleMesh } from "./meshes/triangleMesh/triangleMesh";
import { Texture } from "./texture";
import skyTextureUrl from "../../assets/gfx/sky.png";
import sunTextureUrl from "../../assets/gfx/sun.png";
import { mat4 } from "gl-matrix";

const mvp = mat4.create();

export class Sky {
	mesh: TriangleMesh;
	sunMesh: TriangleMesh;
	renderer: RenderManager;
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
