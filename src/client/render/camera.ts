/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";
import { PerlinNoise } from "../../util/noise";
import { Entity } from "../../world/entity/entity";
import { closestRadian } from "../../util/math";

const transPos = new Float32Array([0, 0, 0]);

export class Camera {
	private shakeIntensity = 0;
	private readonly noise: PerlinNoise;
	public yaw = 0;
	public pitch = -0.25;
	public x = 0;
	public y = 0;
	public z = 0;

	public readonly entityToFollow: Entity;
	public distance = 2.5;

	constructor(entityToFollow: Entity) {
		this.noise = new PerlinNoise();
		this.entityToFollow = entityToFollow;
	}

	rotate(yaw: number, pitch: number) {
		this.yaw = this.yaw + yaw;
		this.pitch = Math.max(
			Math.PI * -0.4,
			Math.min(Math.PI * 0.4, this.pitch + pitch),
		);
	}

	shake(intensity: number) {
		this.shakeIntensity = Math.min(1, Math.max(this.shakeIntensity, intensity));
	}

	stop() {
		this.shakeIntensity = 0;
	}

	update() {
		if (this.yaw > Math.PI * 2) {
			this.yaw -= Math.PI * 2;
		}
		if (this.yaw < 0) {
			this.yaw += Math.PI * 2;
		}
		this.shakeIntensity -= 0.04;
		if (this.shakeIntensity < 0) {
			this.shakeIntensity = 0;
		}
		const v = this.entityToFollow.getVelocity();
		const goalDistance = 6 + Math.max(0, Math.min(v * 6 * (v * 6), 4));
		this.distance = this.distance * 0.98 + goalDistance * 0.02;
	}

	moveEntity(
		ox: number,
		oy: number,
		oz: number,
		speed: number,
		rotateCam = false,
	) {
		let s = 0;
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

		const t = ticks * 0.1;
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

	calcViewMatrix(ticks: number, viewMatrix: mat4) {
		mat4.identity(viewMatrix);
		transPos[0] = 0;
		transPos[1] = 0;
		transPos[2] = -this.distance;
		mat4.translate(viewMatrix, viewMatrix, transPos);

		mat4.rotateX(viewMatrix, viewMatrix, -this.pitch);
		mat4.rotateY(viewMatrix, viewMatrix, -this.yaw);

		const shakeOff = this.getCamOffset(ticks);
		transPos[0] = -this.entityToFollow.x + shakeOff[0];
		transPos[1] = -this.entityToFollow.y + shakeOff[1];
		transPos[2] = -this.entityToFollow.z + shakeOff[2];
		mat4.translate(viewMatrix, viewMatrix, transPos);
		const cx =
			Math.cos(-this.yaw + Math.PI / 2) * this.distance * Math.cos(-this.pitch);
		const cy = Math.sin(-this.pitch) * this.distance;
		const cz =
			Math.sin(-this.yaw + Math.PI / 2) * this.distance * Math.cos(-this.pitch);
		this.x = this.entityToFollow.x + cx;
		this.y = this.entityToFollow.y + cy;
		this.z = this.entityToFollow.z + cz;
		//this.entityToFollow.world.game.render.particle.fxStrike(this.x, this.y, this.z);
	}
}
