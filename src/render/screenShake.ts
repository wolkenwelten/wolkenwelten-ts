/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { PerlinNoise } from "../util/noise";

export class ScreenShakeSystem {
	private shakeIntensity = 0;

	private noise: PerlinNoise;

	constructor() {
		this.noise = new PerlinNoise();
	}

	add(intensity: number) {
		this.shakeIntensity = Math.min(1, Math.max(this.shakeIntensity, intensity));
	}

	stop() {
		this.shakeIntensity = 0;
	}

	update() {
		this.shakeIntensity -= 0.04;
		if (this.shakeIntensity < 0) {
			this.shakeIntensity = 0;
		}
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
}
