/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Being } from "../entity/being";
import { StatusEffect } from "./statusEffect";

export class WetEffect extends StatusEffect {
	id = "Wet";

	update(e: Being): void {
		this.ticks++;

		// Only draw particle fx when we're out of water
		if (!e.world.isLiquid(e.x, e.y, e.z)) {
			const world = e.world;
			const x = e.x - 0.5;
			const y = e.y;
			const z = e.z - 0.5;

			const ox = Math.random();
			const oy = Math.random();
			const oz = Math.random();
			const r = 0x00;
			const g = 0x20 | (Math.random() * 16);
			const b = 0xf0 | (Math.random() * 16);
			const a = 0xff;
			const color = r | (g << 8) | (b << 16) | (a << 24);
			world.game.render.particle.add(
				x + ox,
				y + oy - 1,
				z + oz,
				128,
				color,
				(Math.random() - 0.5) * 0.01,
				-0.03,
				(Math.random() - 0.5) * 0.01,
				-5.5,
				0,
				0,
				0,
				0,
			);

			const burn = e.effects.get("Burning");
			if (burn) {
				burn.ttl -= 20;
			}
		} else {
			const burn = e.effects.get("Burning");
			if (burn) {
				burn.ttl -= 200;
			}
		}

		if (this.ticks > this.ttl) {
			this.destroy();
		}
	}
}
