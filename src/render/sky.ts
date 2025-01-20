import type { RenderManager } from "./render";
import { TriangleMesh } from "./meshes/triangleMesh/triangleMesh";
import { Texture } from "./texture";
import skyTextureUrl from "../../assets/gfx/sky.png";
import { mat4 } from "gl-matrix";

const mvp = mat4.create();

export class Sky {
	mesh: TriangleMesh;
	renderer: RenderManager;
	constructor(renderer: RenderManager) {
		this.renderer = renderer;
		const tex = new Texture(renderer.gl, "sky", skyTextureUrl, "2D");
		tex.linear();
		this.mesh = new TriangleMesh(tex);
		this.mesh.addInverseSphere(500, 6); // Big radius for sky!
		this.mesh.finish();
	}

	draw(p: mat4, v: mat4) {
		mat4.multiply(mvp, p, v);
		const gl = this.renderer.gl;
		gl.disable(gl.DEPTH_TEST);
		gl.depthMask(false);
		this.mesh.draw(mvp);
		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);
	}
}
