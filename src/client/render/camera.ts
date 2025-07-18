/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Camera controls both viewpoint calculation and player-follow logic. It
 * operates in a *third-person chase-cam* configuration by default (see
 * `distance`) but can be adjusted for first-person by setting `distance` to 0.
 *
 * Capabilities
 * ------------
 * • Smooth yaw/pitch updates with clamping to avoid flipping.
 * • Procedural camera shake driven by Perlin noise (`shakeIntensity`).
 * • Converts entity world coordinates into view matrices that downstream
 *   renderers consume every frame.
 *
 * Usage
 * -----
 * 1. Assign `entityToFollow` (usually the local player).
 * 2. Call `update()` each game tick to advance smoothing & shake timers.
 * 3. Use `calcViewMatrix()` and/or `calcUntranslatedViewMatrix()` from the
 *    render path to build the final camera matrices.
 *
 * Pitfalls
 * --------
 * • `rotate()` and `moveEntity()` are in **world space**, not screen space; make
 *   sure input mapping is correct.
 * • `getCamOffset()` is CPU-heavy noise; avoid calling it outside the render
 *   tick.
 */
import { mat4 } from "gl-matrix";
import { PerlinNoise } from "../../util/noise";
import { Entity } from "../../world/entity/entity";
import { closestRadian } from "../../util/math";
import type { World } from "../../world/world";

const transPos = new Float32Array([0, 0, 0]);

export class Camera {
	private shakeIntensity = 0;
	private readonly noise: PerlinNoise;
	public yaw = 0;
	public pitch = -0.25;
	public x = 0;
	public y = 0;
	public z = 0;

	public entityToFollow?: Entity;
	public distance = 2.5;

	constructor() {
		this.noise = new PerlinNoise();
	}

	isUnderwater(world: World): boolean {
		return world.isLiquid(this.x, this.y, this.z);
	}

	isUnderground(world: World): boolean {
		return world.isSolid(this.x, this.y, this.z);
	}

	/**
	 * Adjust current yaw & pitch by deltas while clamping pitch to ±0.4π. Combine
	 * this with pointer-lock mouse input for a familiar FPS feel.
	 */
	rotate(yaw: number, pitch: number) {
		this.yaw = this.yaw + yaw;
		this.pitch = Math.max(
			Math.PI * -0.4,
			Math.min(Math.PI * 0.4, this.pitch + pitch),
		);
	}

	/**
	 * Triggers or updates procedural camera shake. Pass larger values for stronger
	 * effect; the intensity decays automatically over time.
	 */
	shake(intensity: number) {
		this.shakeIntensity = Math.min(1, Math.max(this.shakeIntensity, intensity));
	}

	stop() {
		this.shakeIntensity = 0;
	}

	/**
	 * Call once per tick to decay shake, keep yaw within 0–2π and smoothly adjust
	 * chase distance based on followed entity velocity.
	 */
	update() {
		if (this.yaw > Math.PI * 2) {
			this.yaw -= Math.PI * 2;
		}
		if (this.yaw < 0) {
			this.yaw += Math.PI * 2;
		}
		const v = this.entityToFollow?.getVelocity() || 0;
		const minIntensity = v * 0.3;
		this.shakeIntensity = Math.max(minIntensity, this.shakeIntensity - 0.04);
		const goalDistance = 6 + Math.max(0, Math.min(v * 6 * (v * 6), 4));
		this.distance = this.distance * 0.98 + goalDistance * 0.02;
	}

	/**
	 * Helper to move the followed entity relative to camera orientation. Used by
	 * WASD controls so forward is always *camera forward*.
	 */
	moveEntity(
		ox: number,
		oy: number,
		oz: number,
		speed: number,
		rotateCam = false,
	) {
		let s = 0;
		if (!this.entityToFollow) {
			return;
		}
		if (ox || oz) {
			const p = Math.atan2(oz, -ox) + Math.PI / 2;
			const goal = closestRadian(this.entityToFollow.yaw, p + this.yaw);
			const r = this.entityToFollow.mayJump() ? 0.75 : 0.97;
			this.entityToFollow.yaw = this.entityToFollow.yaw * r + goal * (1 - r);
			s = -speed;

			if (rotateCam) {
				this.yaw -= ox * 0.015;
			}
		}

		this.entityToFollow.move(0, oy, s);
	}

	getCamOffset(ticks: number): [number, number, number] {
		if (this.shakeIntensity === 0) {
			return [0, 0, 0];
		}
		const i = Math.min(this.shakeIntensity, 1);

		const t = ticks * 0.25;
		const ox = this.noise.noise(t, 128, 128) * i;
		const oy = this.noise.noise(128, t, 128) * i;
		const oz = this.noise.noise(128, 128, t) * i;
		return [ox, oy, oz];
	}

	calcUntranslatedViewMatrix(viewMatrix: mat4) {
		mat4.identity(viewMatrix);
		mat4.rotateX(viewMatrix, viewMatrix, -this.pitch);
		mat4.rotateY(viewMatrix, viewMatrix, -this.yaw);
	}

	/**
	 * Builds a full view matrix (including translation) and also updates the
	 * cached camera world position (`x`, `y`, `z`). Must be called once per frame
	 * after the followed entity updated its position.
	 */
	calcViewMatrix(ticks: number, viewMatrix: mat4) {
		mat4.identity(viewMatrix);
		transPos[0] = 0;
		transPos[1] = 0;
		transPos[2] = -this.distance;
		mat4.translate(viewMatrix, viewMatrix, transPos);

		mat4.rotateX(viewMatrix, viewMatrix, -this.pitch);
		mat4.rotateY(viewMatrix, viewMatrix, -this.yaw);

		const shakeOff = this.getCamOffset(ticks);
		transPos[0] = -(this.entityToFollow?.x || 0) + shakeOff[0];
		transPos[1] = -(this.entityToFollow?.y || 0) + shakeOff[1];
		transPos[2] = -(this.entityToFollow?.z || 0) + shakeOff[2];
		mat4.translate(viewMatrix, viewMatrix, transPos);
		const cx =
			Math.cos(-this.yaw + Math.PI / 2) * this.distance * Math.cos(-this.pitch);
		const cy = Math.sin(-this.pitch) * this.distance;
		const cz =
			Math.sin(-this.yaw + Math.PI / 2) * this.distance * Math.cos(-this.pitch);
		this.x = (this.entityToFollow?.x || 0) + cx;
		this.y = (this.entityToFollow?.y || 0) + cy;
		this.z = (this.entityToFollow?.z || 0) + cz;
		//this.entityToFollow.world.game.render.particle.fxStrike(this.x, this.y, this.z);
	}
}
