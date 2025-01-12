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
		const centerX = Math.floor(50 / 32) * 32;
		const centerY = Math.floor(60 / 32) * 32;
		const centerZ = Math.floor(50 / 32) * 32;

		// Initialize LCG with world seed for deterministic noise
		const lcg = new LCG(world.seed);

		const horizontalRadius = 70;
		const verticalRadius = horizontalRadius / 4;  // Make it 4 times wider than tall

		// First pass: Generate pointy stone core
		const pointyHorizontalRadius = 70;
		const pointyVerticalRadius = pointyHorizontalRadius * 1.2;
		const pointyCenterY = centerY - 2; // Position it lower for the pointy bottom

		for (let x = centerX - pointyHorizontalRadius; x <= centerX + pointyHorizontalRadius; x++) {
			for (let z = centerZ - pointyHorizontalRadius; z <= centerZ + pointyHorizontalRadius; z++) {
				const distFromCenter = Math.sqrt(
					Math.pow(x - centerX, 2) +
					Math.pow(z - centerZ, 2)
				);
				
				const baseLength = pointyVerticalRadius * (1 - (distFromCenter / pointyHorizontalRadius));
				const noiseIntensity = 1.7; // Increased for more dramatic effect
				const lengthNoise = lcg.floatNOneToOne() * noiseIntensity;
				const finalLength = Math.max(0, baseLength + lengthNoise);

				// Generate the stalactite column
				for (let y = pointyCenterY; y >= pointyCenterY - finalLength; y--) {
					const normalizedDist = Math.sqrt(
						Math.pow((x - centerX) / pointyHorizontalRadius, 2) +
						Math.pow((y - pointyCenterY) / pointyVerticalRadius, 2) +
						Math.pow((z - centerZ) / pointyHorizontalRadius, 2)
					);

					if (normalizedDist <= 1) {
						world.setBlock(x, y, z, 3); // Stone block
					}
				}
			}
		}

		// Second pass: Generate dirt layer
		for (let x = centerX - horizontalRadius; x <= centerX + horizontalRadius; x++) {
			for (let y = centerY - verticalRadius; y <= centerY + verticalRadius; y++) {
				for (let z = centerZ - horizontalRadius; z <= centerZ + horizontalRadius; z++) {
					const normalizedDist = Math.sqrt(
						Math.pow((x - centerX) / horizontalRadius, 2) +
						Math.pow((y - centerY) / verticalRadius, 2) +
						Math.pow((z - centerZ) / horizontalRadius, 2)
					);

					if (normalizedDist <= 1) {
						world.setBlock(x, y, z, 1);
					}
				}
			}
		}

		// Third pass: Add noise to the top dirt layer
		const noiseIntensity = 1.2; // Increased noise intensity
		for (let x = centerX - horizontalRadius; x <= centerX + horizontalRadius; x++) {
			for (let z = centerZ - horizontalRadius; z <= centerZ + horizontalRadius; z++) {
				for (let y = centerY + verticalRadius; y >= centerY - verticalRadius; y--) {
					if (world.getBlock(x, y, z) === 1) {
						const noise = Math.floor(lcg.floatNOneToOne() * noiseIntensity);
						world.setBlock(x, y + noise, z, 1);
						break;
					}
				}
			}
		}

		// Fourth pass: Convert top layer to grass
		for (let x = centerX - horizontalRadius; x <= centerX + horizontalRadius; x++) {
			for (let z = centerZ - horizontalRadius; z <= centerZ + horizontalRadius; z++) {
				for (let y = centerY + verticalRadius; y >= centerY - verticalRadius; y--) {
					if (world.getBlock(x, y, z) === 1) {
						world.setBlock(x, y, z, 2);
						break;
					}
				}
			}
		}

		// Final pass: Place decorative assets
		if (!this.assets) {
			throw new Error("Assets not loaded");
		}

		// Place assets on the grass - adjust step size for better distribution
		for (let x = centerX - horizontalRadius + 2; x <= centerX + horizontalRadius - 2; x += 3) {
			for (let z = centerZ - horizontalRadius + 2; z <= centerZ + horizontalRadius - 2; z += 3) {
				// Find the top grass block
				let foundSurface = false;
				for (let y = centerY + verticalRadius + 5; y >= centerY - verticalRadius - 5; y--) {
					if (world.getBlock(x, y, z) === 2) { // If it's grass
						foundSurface = true;
						
						// Increase chance of placement and check surrounding area
						if (lcg.float() > 0.9) {
							// Make sure we have enough space (check a few blocks around)
							let hasSpace = true;
							for (let dx = -1; dx <= 1; dx++) {
								for (let dz = -1; dz <= 1; dz++) {
									if (world.getBlock(x + dx, y + 1, z + dz) !== 0) {
										hasSpace = false;
										break;
									}
								}
							}

							if (hasSpace) {
								// Choose a random asset type
								const roll = lcg.float();
								let asset: WorldGenAsset;
								
								if (roll < 0.3) {
									// Trees (30% chance)
									asset = lcg.bool() ? this.assets.treeA : 
										   lcg.bool() ? this.assets.treeB : this.assets.treeC;
								} else if (roll < 0.5) {
									// Spruce (20% chance)
									asset = this.assets.spruceA;
								} else if (roll < 0.8) {
									// Bushes (30% chance)
									asset = lcg.bool() ? this.assets.bushA : 
										   lcg.bool() ? this.assets.bushB : this.assets.bushC;
								} else {
									// Rocks (20% chance)
									asset = lcg.bool() ? this.assets.rockA : 
										   lcg.bool() ? this.assets.rockB : this.assets.rockC;
								}
								
								// Place the asset with slight random offset
								const offsetX = Math.floor(lcg.floatNOneToOne() * 2);
								const offsetZ = Math.floor(lcg.floatNOneToOne() * 2);
								asset.worldBlit(world, x + offsetX, y + 1, z + offsetZ);
							}
						}
						break;
					}
				}
				
				// Skip rest of column if we found a surface
				if (foundSurface) continue;
			}
		}
	}

	genChunk(_chunk: Chunk) {
		// Empty, we just preGen everything!!!
	}
}
