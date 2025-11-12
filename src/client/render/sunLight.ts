import { mat4, vec3, vec4 } from "gl-matrix";

import type { Camera } from "./camera";
import { invalidateTextureUnit } from "./texture";

const tmpVec = vec3.create();
const upVec = vec3.fromValues(0, 1, 0);
const altUpVec = vec3.fromValues(0, 0, 1);
const originVec = vec4.fromValues(0, 0, 0, 1);
const tmpVec4 = vec4.create();

export class SunLight {
	private readonly gl: WebGL2RenderingContext;
	private readonly direction = vec3.normalize(
		vec3.create(),
		vec3.fromValues(0.45, -1.0, 0.25),
	);
	private readonly viewMatrix = mat4.create();
	private readonly projectionMatrix = mat4.create();
	private readonly lightMatrix = mat4.create();
	private readonly focus = vec3.create();
	private readonly position = vec3.create();
	private readonly shadowMapSize: number;
	private readonly framebuffer: WebGLFramebuffer;
	private readonly depthTexture: WebGLTexture;

	private shadowRadius = 192;

	constructor(gl: WebGL2RenderingContext, size = 1536) {
		this.gl = gl;
		this.shadowMapSize = size;
		const texture = gl.createTexture();
		if (!texture) {
			throw new Error("Failed to allocate shadow map texture");
		}
		this.depthTexture = texture;
		gl.bindTexture(gl.TEXTURE_2D, texture);
		invalidateTextureUnit(0);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.DEPTH_COMPONENT24,
			size,
			size,
			0,
			gl.DEPTH_COMPONENT,
			gl.UNSIGNED_INT,
			null,
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_COMPARE_MODE,
			gl.COMPARE_REF_TO_TEXTURE,
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
		const fb = gl.createFramebuffer();
		if (!fb) {
			throw new Error("Failed to allocate shadow map framebuffer");
		}
		this.framebuffer = fb;
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.DEPTH_ATTACHMENT,
			gl.TEXTURE_2D,
			texture,
			0,
		);
		gl.drawBuffers([gl.NONE]);
		gl.readBuffer(gl.NONE);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.drawBuffers([gl.BACK]);
		gl.readBuffer(gl.BACK);
	}

	getLightMatrix(): mat4 {
		return this.lightMatrix;
	}

	getDirection(): vec3 {
		return this.direction;
	}

	getDepthTexture(): WebGLTexture {
		return this.depthTexture;
	}

	getShadowMapSize(): number {
		return this.shadowMapSize;
	}

	getRadius(): number {
		return this.shadowRadius;
	}

	getFocus(): vec3 {
		return this.focus;
	}

	getPosition(): vec3 {
		return this.position;
	}

	update(camera: Camera, renderDistance: number) {
		const radius = Math.max(64, Math.min(renderDistance * 0.75, 256));
		this.shadowRadius = radius;
		this.focus[0] = camera.x;
		this.focus[1] = camera.y;
		this.focus[2] = camera.z;
		const lightPos = tmpVec;
		vec3.scale(lightPos, this.direction, -radius * 2);
		vec3.add(lightPos, lightPos, this.focus);
		vec3.copy(this.position, lightPos);

		const up = Math.abs(this.direction[1]) > 0.9 ? altUpVec : upVec;
		mat4.lookAt(this.viewMatrix, lightPos, this.focus, up);
		const near = 8;
		const far = radius * 4;
		mat4.ortho(
			this.projectionMatrix,
			-radius,
			radius,
			-radius,
			radius,
			near,
			far,
		);
		mat4.multiply(this.lightMatrix, this.projectionMatrix, this.viewMatrix);

		vec4.copy(tmpVec4, originVec);
		vec4.transformMat4(tmpVec4, tmpVec4, this.lightMatrix);
	}

	beginRender() {
		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.drawBuffers([gl.NONE]);
		gl.readBuffer(gl.NONE);
		gl.viewport(0, 0, this.shadowMapSize, this.shadowMapSize);
		gl.colorMask(false, false, false, false);
		gl.cullFace(gl.FRONT);
		gl.clear(gl.DEPTH_BUFFER_BIT);
	}

	endRender(width: number, height: number) {
		const gl = this.gl;
		gl.colorMask(true, true, true, true);
		gl.cullFace(gl.BACK);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.drawBuffers([gl.BACK]);
		gl.readBuffer(gl.BACK);
		gl.viewport(0, 0, width, height);
	}
}
