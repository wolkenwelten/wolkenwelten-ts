/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from "../../../assets/gfx/items/earthBullet.png";
import meshUrl from "../../../assets/vox/items/stone.vox?url";
import type { TriangleMesh } from "../../client/render/meshes/triangleMesh/triangleMesh";
import type { VoxelMesh } from "../../client/render/meshes/voxelMesh/voxelMesh";
import { Character } from "../../world/entity/character";
import { Entity } from "../../world/entity/entity";
import { Mob } from "../../world/entity/mob";
import { World } from "../../world/world";

import { Rune } from "./rune";

export class EarthBullet extends Rune {
	name = "Earth bullet";
	icon = itemIcon;
	meshUrl = meshUrl;
	range = 10;

	bulletEntity?: EarthBulletEntity;

	grabBlock(e: Character, x: number, y: number, z: number) {
		const blockType = e.world.getBlock(x, y, z);
		if (blockType === undefined) {
			return;
		}
		const bt = this.world.blocks[blockType];
		if (bt.miningCat !== "Pickaxe") {
			return;
		}
		this.world.game.render.particle.fxBlockBreak(x, y, z, bt);
		e.world.setBlock(x, y, z, 0);
		this.world.dangerZone.add(x - 1, y - 1, z - 1, 3, 3, 3);
		this.bulletEntity = new EarthBulletEntity(this.world, blockType, e);
		this.bulletEntity.x = x + 0.5;
		this.bulletEntity.y = y + 0.5;
		this.bulletEntity.z = z + 0.5;
		this.bulletEntity.scale = 2;
		this.bulletEntity.playUnmovingSound("tock", 0.3);

		e.cooldown(32);
		e.hitAnimation = this.world.game.render.frames;
	}

	use(e: Character) {
		if (e.isOnCooldown()) {
			return;
		}
		if (this.bulletEntity) {
			return;
		}
		for (let i = 0; i < 12; i++) {
			const pitchDelta = (i / 2) * Math.PI * 0.05 * ((i & 1) * 2 - 1);
			const ray = e.raycast(false, pitchDelta - 0.3, 64);
			if (!ray) {
				continue;
			}
			const [x, y, z] = ray;
			const blockType = e.world.getBlock(x, y, z);
			if (blockType === undefined) {
				continue;
			}
			const bt = this.world.blocks[blockType];
			if (bt.miningCat !== "Pickaxe") {
				continue;
			}

			const dx = x + 0.5 - e.x;
			const dy = y + 0.5 - e.y;
			const dz = z + 0.5 - e.z;
			const dd = dx * dx + dy * dy + dz * dz;
			if (dd < this.range * this.range) {
				this.grabBlock(e, x, y, z);
				return;
			}
		}
	}

	useRelease(e: Character) {
		if (!this.bulletEntity) {
			return;
		}
		this.bulletEntity.ticksAlive = 1;
		const dx = e.x - this.bulletEntity.x;
		const dy = e.y - this.bulletEntity.y;
		const dz = e.z - this.bulletEntity.z;
		const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
		const vel = Math.max(0.1, Math.min(0.5, 1 - d * 0.1));
		const [vx, vy, vz] = e.direction(0, 0.2, -2, vel);
		this.bulletEntity.shotX = this.bulletEntity.vx = vx;
		this.bulletEntity.shotY = this.bulletEntity.vy = vy;
		this.bulletEntity.shotZ = this.bulletEntity.vz = vz;
		this.bulletEntity.playSound("projectile", 1, true);
		this.bulletEntity = undefined;

		e.cooldown(32);
		e.hitAnimation = this.world.game.render.frames;
		this.world.game.render.camera.shake(0.3);
	}
}

export class EarthBulletEntity extends Entity {
	blockType: number;
	caster: Character;
	ticksAlive = 0;
	shotX = 0;
	shotY = 0;
	shotZ = 0;

	constructor(world: World, blockType: number, caster: Character) {
		super(world);
		if (blockType === 2) {
			blockType = 1;
		}
		this.blockType = blockType;
		this.caster = caster;
		this.vy = 0.2;
	}

	mesh(): TriangleMesh | VoxelMesh | null {
		return (
			this.world.game.render.assets.blockType[this.blockType] ||
			this.world.game.render.assets.bag
		);
	}

	private disintegrate() {
		const bt = this.world.blocks[this.blockType];
		const particle = this.world.game.render.particle;
		const bx = this.x - 0.5;
		const by = this.y - 0.5;
		const bz = this.z - 0.5;

		for (let i = 0; i < 128; i++) {
			const color = i < 64 ? bt.colorA : bt.colorB;
			const x = bx + Math.random();
			const y = by + Math.random();
			const z = bz + Math.random();
			const vx = this.shotX * 0.5 + (Math.random() - 0.5) * 0.1;
			const vy = this.shotY * 0.5 + (Math.random() - 0.5) * 0.1;
			const vz = this.shotZ * 0.5 + (Math.random() - 0.5) * 0.1;
			particle.add(x, y, z, 192, color, vx, vy, vz, -1, 0, -0.002, 0, 0);
		}
	}

	private checkForEntityCollisions() {
		for (const e of this.world.entities) {
			if (
				e === this ||
				(this.ticksAlive < 16 && e === this.caster) ||
				e.destroyed
			) {
				continue;
			}
			if (!(e instanceof Mob || e instanceof Character)) {
				continue;
			}
			const dx = e.x - this.x;
			const dy = e.y - this.y - 0.5;
			const dz = e.z - this.z;
			const dd = dx * dx + dy * dy * 0.5 + dz * dz;
			if (dd <= 1.1) {
				const dmg = Math.max(
					2,
					this.world.blocks[this.blockType].health * 0.05,
				);
				this.caster.doDamage(e, dmg);
				this.disintegrate();
				this.playUnmovingSound("punch", 1);
				this.destroy();
				return;
			}
		}
	}

	updateHover() {
		const [dirx, diry, dirz] = this.caster.direction(0, 0, -1, 1.5);
		const goalX = this.caster.x + dirx;
		const goalY = this.caster.y + diry;
		const goalZ = this.caster.z + dirz;

		const dx = goalX - this.x;
		const dy = goalY - this.y;
		const dz = goalZ - this.z;
		const dd = dx * dx + dy * dy + dz * dz;
		const vmax = dd * 0.2;

		const dn = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
		this.vx += (dx / dn) * 0.02;
		this.vy += (dy / dn) * 0.04;
		this.vz += (dz / dn) * 0.02;
		if (this.vx > 0) {
			this.vx = Math.min(vmax, this.vx);
		} else {
			this.vx = Math.max(-vmax, this.vx);
		}
		if (this.vy > 0) {
			this.vy = Math.min(vmax, this.vy);
		} else {
			this.vy = Math.max(-vmax, this.vy);
		}
		if (this.vz > 0) {
			this.vz = Math.min(vmax, this.vz);
		} else {
			this.vz = Math.max(-vmax, this.vz);
		}

		this.yaw = this.caster.yaw;
	}

	updateShot() {
		++this.ticksAlive;
		this.world.game.render.particle.fxBlockMine(
			this.x - 0.5,
			this.y - 0.5,
			this.z - 0.5,
			this.world.blocks[this.blockType],
		);
		if (this.collides()) {
			this.world.game.render.particle.fxBlockBreak(
				this.x - 0.5,
				this.y - 0.5,
				this.z - 0.5,
				this.world.blocks[this.blockType],
			);
			this.disintegrate();
			this.playUnmovingSound("punch", 1);
			this.destroy();
			return;
		}
		this.checkForEntityCollisions();
	}

	update() {
		super.update();
		if (this.ticksAlive) {
			this.updateShot();
		} else {
			this.updateHover();
		}
	}
}
