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
import { mat4, vec3 } from "gl-matrix";
import { SunLight } from "./sunLight";

const skyMVP = mat4.create();
const sunMVP = mat4.create();
const sunModel = mat4.create();
const sunPos = vec3.create();
const camPos = vec3.create();
const toCamera = vec3.create();
const sunRight = vec3.create();
const sunUp = vec3.create();
const worldUp = vec3.fromValues(0, 1, 0);
const altUp = vec3.fromValues(0, 0, 1);

export class Sky {
	mesh: TriangleMesh;
	sunMesh: TriangleMesh;
	renderer: RenderManager;
	private readonly sunLight: SunLight;
	private readonly sunSize = 18;
	/**
	 * Creates textured meshes for the sky dome and sun, applying linear filtering
	 * so the low-res textures don't look blocky. Only lightweight CPU work is
	 * done here; GPU buffers are built inside `TriangleMesh.finish()`.
	 */
	constructor(renderer: RenderManager, sun: SunLight) {
		this.renderer = renderer;
		this.sunLight = sun;
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
		const size = 1;
		this.sunMesh.vertices.push(
			-size,
			size,
			0,
			0,
			0,
			1.0, // Top-left
			size,
			size,
			0,
			1,
			0,
			1.0, // Top-right
			-size,
			-size,
			0,
			0,
			1,
			1.0, // Bottom-left

			size,
			size,
			0,
			1,
			0,
			1.0, // Top-right
			size,
			-size,
			0,
			1,
			1,
			1.0, // Bottom-right
			-size,
			-size,
			0,
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
		mat4.multiply(skyMVP, p, v);
		const gl = this.renderer.gl;

		gl.disable(gl.DEPTH_TEST);
		gl.depthMask(false);

		// Draw sky dome
		this.mesh.draw(skyMVP);

		const sunPosition = this.sunLight.getPosition();
		vec3.copy(sunPos, sunPosition);
		const camera = this.renderer.camera;
		camPos[0] = camera.x;
		camPos[1] = camera.y;
		camPos[2] = camera.z;
		vec3.subtract(toCamera, camPos, sunPos);
		vec3.normalize(toCamera, toCamera);
		vec3.cross(sunRight, toCamera, worldUp);
		if (vec3.length(sunRight) < 1e-3) {
			vec3.cross(sunRight, toCamera, altUp);
		}
		vec3.normalize(sunRight, sunRight);
		vec3.cross(sunUp, sunRight, toCamera);
		vec3.normalize(sunUp, sunUp);
		vec3.scale(sunRight, sunRight, this.sunSize);
		vec3.scale(sunUp, sunUp, this.sunSize);

		mat4.identity(sunModel);
		sunModel[0] = sunRight[0];
		sunModel[1] = sunRight[1];
		sunModel[2] = sunRight[2];
		sunModel[4] = sunUp[0];
		sunModel[5] = sunUp[1];
		sunModel[6] = sunUp[2];
		sunModel[8] = toCamera[0];
		sunModel[9] = toCamera[1];
		sunModel[10] = toCamera[2];
		sunModel[12] = sunPos[0];
		sunModel[13] = sunPos[1];
		sunModel[14] = sunPos[2];
		mat4.multiply(sunMVP, p, v);
		mat4.multiply(sunMVP, sunMVP, sunModel);

		// Enable blending for the sun (✿◠‿◠)
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		this.sunMesh.draw(sunMVP);
		gl.disable(gl.BLEND);

		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);
	}
}
