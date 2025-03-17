/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from "../../../assets/gfx/items/earthWall.png";
import meshUrl from "../../../assets/vox/items/stone.vox?url";
import { TriangleMesh } from "../../client/render/meshes/triangleMesh/triangleMesh";
import { VoxelMesh } from "../../client/render/meshes/voxelMesh/voxelMesh";
import { easeOutSine } from "../../util/math";
import { Character } from "../../world/entity/character";
import { Entity } from "../../world/entity/entity";
import { World } from "../../world/world";

import { Rune } from "./rune";

export interface WallSelection {
	block: number;
	from: [number, number, number];
	to: [number, number, number];
	vx: number;
	vy: number;
	vz: number;
}

export class EarthWall extends Rune {
	name = "Earth wall";
	icon = itemIcon;
	meshUrl = meshUrl;
	range = 5;

	private lastUseFrameCount = -1;

	private getWallSelection(e: Character) {
		const ray = e.raycast(false, -0.5);
		if (!ray) {
			return [];
		}
		const [x, y, z] = ray;
		const blockType = e.world.getBlock(x, y, z);
		if (blockType === undefined) {
			return [];
		}
		const dx = x + 0.5 - e.x;
		const dy = y + 0.5 - e.y;
		const dz = z + 0.5 - e.z;
		const dd = dx * dx + dy * dy + dz * dz;
		if (dd > this.range * this.range) {
			return [];
		}

		const walkDir = e.walkDirection();
		const ret: WallSelection[] = [];
		for (let ox = -1; ox <= 1; ox++) {
			const oy = 0;
			for (let oz = -1; oz <= 1; oz++) {
				const b = e.world.getBlock(x + ox, y + oy, z + oz);
				if (!b) {
					continue;
				}
				if (this.world.blocks[b].miningCat !== "Pickaxe") {
					continue;
				}
				let gx = x + ox;
				let gy = y + oy;
				let gz = z + oz;
				let vx = 0;
				let vy = 0.15;
				let vz = 0;

				if (Math.abs(walkDir[0]) > Math.abs(walkDir[1])) {
					if (walkDir[0] > 0) {
						gy += ox + 2;
						gx = x - oy - 2;
						vx -= 0.5;
					} else {
						gy += 2 - ox;
						gx = x - oy + 2;
						vx += 0.5;
					}
				} else {
					if (walkDir[1] > 0) {
						gy += oz + 2;
						gz = z - oy - 2;
						vz -= 0.5;
					} else {
						gy += 2 - oz;
						gz = z - oy + 2;
						vz += 0.5;
					}
				}
				const gb = e.world.getBlock(gx, gy, gz);
				if (gb) {
					continue;
				}
				if (!e.world.isSolid(gx, y + oy, gz)) {
					continue;
				}
				ret.push({
					from: [x + ox, y + oy, z + oz],
					to: [gx, gy, gz],
					block: b,
					vx,
					vy,
					vz,
				});
			}
		}
		return ret;
	}

	use(e: Character) {
		if (e.isOnCooldown()) {
			return;
		}

		const frame = e.world.game.render?.frames || 0;
		if (this.lastUseFrameCount !== frame) {
			const selection = this.getWallSelection(e);
			if (selection.length === 0) {
				return;
			}
			for (const b of selection) {
				e.world.game.render?.decals.addBlock(
					b.from[0],
					b.from[1],
					b.from[2],
					0,
					2,
				);
				e.world.game.render?.decals.addBlock(b.to[0], b.to[1], b.to[2], 1, 2);
			}
			this.lastUseFrameCount = frame;
		}
	}

	useRelease(e: Character) {
		const selection = this.getWallSelection(e);
		if (selection.length === 0) {
			return;
		}

		if (this.lastUseFrameCount < 0) {
			return;
		}
		this.lastUseFrameCount = -1;

		for (const b of selection) {
			this.world.setBlock(b.from[0], b.from[1], b.from[2], 0);
			this.world.dangerZone.add(
				b.from[0] - 1,
				b.from[1] - 1,
				b.from[2] - 1,
				3,
				3,
				3,
			);

			for (const t of this.world.entities.values()) {
				const dx = t.x - b.from[0];
				const dy = t.y - (b.from[1] + 1);
				const dz = t.z - b.from[2];
				const dd = dx * dx + dy * dy * 0.5 + dz * dz;
				if (dd < 1.5) {
					t.vx += b.vx;
					t.vy += b.vy;
					t.vz += b.vz;
					t.x = b.to[0];
					t.y = b.to[1];
					t.z = b.to[2];
					t.vx = Math.min(0.4, Math.max(-0.4, t.vx));
					t.vy = Math.min(0.3, Math.max(-0.3, t.vy));
					t.vz = Math.min(0.4, Math.max(-0.4, t.vz));
				}
			}
			const e = new EarthWallBlock(this.world, b.block, b.from, b.to);
			e.playSound("pock", 0.3);
		}

		for (const b of selection) {
			for (const t of this.world.entities.values()) {
				const dx = t.x - b.from[0];
				const dy = t.y - (b.from[1] + 1);
				const dz = t.z - b.from[2];
				const dd = dx * dx + dy * dy * 0.5 + dz * dz;
				if (dd < 2) {
					t.vx += b.vx;
					t.vy += b.vy;
					t.vz += b.vz;
				}
			}
		}
		e.cooldown(80);
	}
}

export class EarthWallBlock extends Entity {
	blockType: number;
	from: [number, number, number];
	to: [number, number, number];
	ticksActive = 0;

	constructor(
		world: World,
		blockType: number,
		from: [number, number, number],
		to: [number, number, number],
	) {
		super(world);
		if (blockType === 2) {
			blockType = 1;
		}
		this.blockType = blockType;
		this.from = from;
		this.to = to;
		this.x = from[0] + 0.5;
		this.y = from[1] + 0.5;
		this.z = from[2] + 0.5;
		this.scale = 2;
		this.world.game.render?.particle.fxBlockBreak(
			this.x - 0.5,
			this.y - 0.5,
			this.z - 0.5,
			this.world.blocks[this.blockType],
		);
		this.playSound("projectile", 0.2, true);
	}

	mesh(): TriangleMesh | VoxelMesh | null {
		return (
			this.world.game.render?.assets.blockType[this.blockType] ||
			this.world.game.render?.assets.bag ||
			null
		);
	}

	update() {
		super.update();
		const t = easeOutSine(++this.ticksActive * 0.05);
		this.pitch = t * Math.PI;
		if (t >= 0.99) {
			this.world.setBlock(this.to[0], this.to[1], this.to[2], this.blockType);
			this.world.dangerZone.add(
				this.to[0] - 1,
				this.to[1] - 1,
				this.to[2] - 1,
				3,
				3,
				3,
			);
			this.world.game.render?.particle.fxBlockBreak(
				this.x - 0.5,
				this.y - 0.5,
				this.z - 0.5,
				this.world.blocks[this.blockType],
			);
			this.playUnmovingSound("pock", 0.3);
			this.destroy();
		} else {
			this.x = this.from[0] * (1 - t) + this.to[0] * t + 0.5;
			this.y = this.from[1] * (1 - t) + this.to[1] * t + 0.5;
			this.z = this.from[2] * (1 - t) + this.to[2] * t + 0.5;
			this.vx = this.vy = this.vz = 0;
		}
	}
}
