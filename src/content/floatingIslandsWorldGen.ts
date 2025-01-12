/* Copyright 2024 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { WorldGenAsset } from "../world/worldGenAsset";
import { WorldGen } from "../world/worldGen";

import voxBushA from "../../assets/wg/bush_a.vox?url";
import voxBushB from "../../assets/wg/bush_b.vox?url";
import voxBushC from "../../assets/wg/bush_c.vox?url";
import voxRockA from "../../assets/wg/rock_a.vox?url";
import voxRockB from "../../assets/wg/rock_b.vox?url";
import voxRockC from "../../assets/wg/rock_c.vox?url";
import voxSpruceA from "../../assets/wg/spruce_a.vox?url";
import voxTreeA from "../../assets/wg/tree_a.vox?url";
import voxTreeB from "../../assets/wg/tree_b.vox?url";
import voxTreeC from "../../assets/wg/tree_c.vox?url";

import { LCG } from "../util/prng";
import type { Chunk } from "../world/chunk/chunk";
import type { World } from "../world/world";
import type { Character } from "../world/entity/character";
import type { StaticObject } from "../world/chunk/staticObject";

export interface WorldGenAssetList {
	bushA: WorldGenAsset;
	bushB: WorldGenAsset;
	bushC: WorldGenAsset;

	rockA: WorldGenAsset;
	rockB: WorldGenAsset;
	rockC: WorldGenAsset;

	treeA: WorldGenAsset;
	treeB: WorldGenAsset;
	treeC: WorldGenAsset;

	spruceA: WorldGenAsset;
}

export class FloatingIslandsWorldGen extends WorldGen {
	private assets?: WorldGenAssetList;

	async init() {
		this.assets = {
			bushA: await WorldGenAsset.load(voxBushA, [5, 6]),
			bushB: await WorldGenAsset.load(voxBushB, [6, 10]),
			bushC: await WorldGenAsset.load(voxBushC, [6, 5]),

			rockA: await WorldGenAsset.load(voxRockA, [3]),
			rockB: await WorldGenAsset.load(voxRockB, [3, 4]),
			rockC: await WorldGenAsset.load(voxRockC, [3, 12]),

			treeA: await WorldGenAsset.load(voxTreeA, [5, 11]),
			treeB: await WorldGenAsset.load(voxTreeB, [5, 11]),
			treeC: await WorldGenAsset.load(voxTreeC, [5, 11]),

			spruceA: await WorldGenAsset.load(voxSpruceA, [5, 11]),
		};
	}

	spawnPos(_player: Character): [number, number, number] {
		return [50, 140, 50];
	}

	mayGC(_chunk: Chunk): boolean {
		// Todo: Determine whether the chunk is an empty sky chunk, then it may GC
		return false;
	}

	preGen(world: World) {
		const centerX = 50;
		const centerY = 60;
		const centerZ = 50;
		const radius = 80;

		// Generate a modified sphere
		for (let x = centerX - radius; x <= centerX + radius; x++) {
			for (let y = centerY - radius; y <= centerY + radius; y++) {
				for (let z = centerZ - radius; z <= centerZ + radius; z++) {
					// Calculate distance but modify Y to create the desired shape
					const yStretch = (y > centerY) ? 1.2 : 0.7; // Flatten top, squeeze bottom
					const distance = Math.sqrt(
						Math.pow(x - centerX, 2) +
						Math.pow((y - centerY) * yStretch, 2) +
						Math.pow(z - centerZ, 2)
					);
					
					// Add some vertical stretching to make it more pointy at bottom
					const heightFactor = (y < centerY) ? 
						1.0 + (centerY - y) / 50 : // Gradually more pointy towards bottom
						1.0;
					
					// If point is within modified radius, place a block
					if (distance <= radius / heightFactor) {
						world.setBlock(x, y, z, 1);
					}
				}
			}
		}
	}

	genChunk(_chunk: Chunk) {
		// Empty, we just preGen everything!!!
	}
}
