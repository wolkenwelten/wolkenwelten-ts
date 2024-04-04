/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from 'gl-matrix';

import type { TriangleMesh } from '../../render/meshes/triangleMesh/triangleMesh';
import type { VoxelMesh } from '../../render/meshes/voxelMesh/voxelMesh';
import type { Item } from '../item/item';
import type { World } from '../world';
import type { Character } from './character';
import { Entity } from './entity';

const transPos = new Float32Array([0, 0, 0]);
const modelViewMatrix = mat4.create();

export class ItemDrop extends Entity {
	item: Item;
	noCollect = false;

	constructor(world: World, x: number, y: number, z: number, item: Item) {
		super(world);

		this.x = x;
		this.y = y;
		this.z = z;
		this.item = item;
	}

	static fromItem(item: Item, e: Entity): ItemDrop {
		const drop = new ItemDrop(e.world, e.x, e.y, e.z, item);
		const [vx, vz] = e.walkDirection();
		drop.vy = 0.01;
		drop.vx = vx * -0.1;
		drop.vz = vz * -0.1;
		drop.noCollect = true;
		return drop;
	}

	mesh(): TriangleMesh | VoxelMesh {
		return this.item.mesh();
	}

	canCollect(player: Character): boolean {
		if (this.item.isWeapon) {
			return player.equipmentWeapon() === undefined;
		} else {
			for (let i = 0; i < player.inventory.items.length; i++) {
				if (player.inventory.items[i] === undefined) {
					return true;
				}
			}
			return false;
		}
	}

	collectBy(player: Character) {
		if (!this.canCollect(player)) {
			return;
		}

		if (this.item.isWeapon) {
			player.equipment.items[0] = this.item;
		} else {
			if (!player.inventory.add(this.item)) {
				return;
			}
		}

		this.destroy();
		this.world.game.audio.play('pock', 0.4);
	}

	update() {
		super.update();
		const player = this.world.game.player;
		const canCollect = this.canCollect(player);
		if (!canCollect) {
			return;
		}
		const dx = player.x - this.x;
		const dy = player.y - this.y;
		const dz = player.z - this.z;
		const dd = dx * dx + dy * dy + dz * dz;

		if (this.noCollect) {
			if (dd > 2.4 * 2.4) {
				this.noCollect = false;
			}
		} else {
			if (dd < 2.4 * 2.4) {
				this.vx += dx * 0.006;
				this.vy += dy * 0.006;
				this.vz += dz * 0.006;
			}
			if (dd < 1.3 * 1.3) {
				this.collectBy(player);
			}
		}
	}

	draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
		if (this.destroyed) {
			return;
		}
		this.world.game.render.decals.addShadow(this.x, this.y, this.z, 1);

		mat4.identity(modelViewMatrix);
		const yOff =
			Math.sin(this.id * 7 + this.world.game.ticks * 0.07) * 0.1 + 0.2;
		transPos[0] = this.x;
		transPos[1] = this.y + yOff;
		transPos[2] = this.z;
		mat4.translate(modelViewMatrix, modelViewMatrix, transPos);

		mat4.rotateY(
			modelViewMatrix,
			modelViewMatrix,
			this.id * 7 + this.world.game.ticks * 0.01
		);
		mat4.mul(modelViewMatrix, viewMatrix, modelViewMatrix);
		mat4.mul(modelViewMatrix, projectionMatrix, modelViewMatrix);
		const dx = this.x - cam.x;
		const dy = this.y - cam.y;
		const dz = this.z - cam.z;
		const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
		const renderDistance = this.world.game.render.renderDistance;
		const alpha = Math.min(1, Math.max(0, renderDistance - d) / 8);
		this.mesh().draw(modelViewMatrix, alpha);
	}
}
