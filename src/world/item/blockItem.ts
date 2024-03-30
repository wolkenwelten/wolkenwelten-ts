/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { TriangleMesh } from "../../render/meshes/triangleMesh/triangleMesh";
import type { VoxelMesh } from "../../render/meshes/voxelMesh/voxelMesh";
import type { Entity } from "../entity/entity";
import type { World } from "../world";
import { Character } from "../entity/character";
import { Item } from "./item";

export class BlockItem extends Item {
	blockType: number;
	stackSize = 99;

	constructor(world: World, blockType: number, amount: number) {
		const bt = world.blocks[blockType];
		if (!bt) {
			throw new Error(`Invalid blockType: ${blockType}`);
		}
		super(world, amount);
		this.blockType = blockType;
		this.icon = this.world.blocks[this.blockType].icon;
		this.name = bt.longName || bt.name;
	}

	mesh(): TriangleMesh | VoxelMesh {
		return (
			this.world.game.render.assets.blockType[this.blockType] ||
			this.world.game.render.assets.bag
		);
	}

	clone(): BlockItem {
		return new BlockItem(this.world, this.blockType, this.amount);
	}

	use(e: Entity) {
		if (
			this.destroyed ||
			(e instanceof Character && this.world.game.ticks < e.lastAction)
		) {
			return;
		}

		const ray = e.raycast(true);
		if (!ray) {
			return;
		}
		const [x, y, z] = ray;
		this.world.blocks[this.blockType].playPlaceSound(e.world);
		e.world.setBlock(x, y, z, this.blockType);
		this.world.dangerZone.add(x - 1, y - 1, z - 1, 3, 3, 3);
		if (--this.amount <= 0) {
			this.destroy();
		}

		e.cooldown(32);
		if (e instanceof Character) {
			e.hitAnimation = this.world.game.render.frames;
			e.inventory.updateAll();
		}
		return;
	}

	mayStackWith(other: Item): boolean {
		if (other instanceof BlockItem) {
			return other.blockType === this.blockType;
		} else {
			return false;
		}
	}
}
