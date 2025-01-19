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
import { StaticObject } from "../world/chunk/staticObject";

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

	mayGC(_chunk: Chunk): boolean {
		// Todo: Determine whether the chunk is an empty sky chunk, then it may GC
		return false;
	}

	private floatingIsland(
		world: World,
		lcg: LCG,
		centerX: number,
		centerY: number,
		centerZ: number,
		size = 50,
	) {
		const horizontalRadius = size;
		const verticalRadius = horizontalRadius / 4; // Make it 4 times wider than tall

		// First pass: Generate pointy stone core
		const pointyHorizontalRadius = size;
		const pointyVerticalRadius = pointyHorizontalRadius * 1.2;
		const pointyCenterY = centerY - 2; // Position it lower for the pointy bottom

		let hasTrees = lcg.bool();
		let hasSpruce = lcg.bool();
		let hasBushes = hasTrees || hasSpruce || lcg.bool();
		let hasRocks = lcg.bool();

		for (
			let x = centerX - pointyHorizontalRadius;
			x <= centerX + pointyHorizontalRadius;
			x++
		) {
			for (
				let z = centerZ - pointyHorizontalRadius;
				z <= centerZ + pointyHorizontalRadius;
				z++
			) {
				const distFromCenter = Math.sqrt(
					Math.pow(x - centerX, 2) + Math.pow(z - centerZ, 2),
				);

				const baseLength =
					pointyVerticalRadius *
					(1 - distFromCenter / pointyHorizontalRadius) *
					0.5;

				const noiseIntensity = 1.4; // Increased for more dramatic effect
				const lengthNoise = lcg.floatNOneToOne() * noiseIntensity;
				const finalLength = Math.max(0, baseLength + lengthNoise);

				// Generate the stalactite column
				for (let y = pointyCenterY; y >= pointyCenterY - finalLength; y--) {
					const normalizedDist = Math.sqrt(
						Math.pow((x - centerX) / pointyHorizontalRadius, 2) +
							Math.pow((y - pointyCenterY) / pointyVerticalRadius, 2) +
							Math.pow((z - centerZ) / pointyHorizontalRadius, 2),
					);

					if (normalizedDist <= 1) {
						world.setBlock(x, y, z, 3); // Stone block
					}
				}
			}
		}

		// Second pass: Generate dirt layer
		for (
			let x = centerX - horizontalRadius;
			x <= centerX + horizontalRadius;
			x++
		) {
			for (
				let y = centerY - verticalRadius;
				y <= centerY + verticalRadius;
				y++
			) {
				for (
					let z = centerZ - horizontalRadius;
					z <= centerZ + horizontalRadius;
					z++
				) {
					const normalizedDist = Math.sqrt(
						Math.pow((x - centerX) / horizontalRadius, 2) +
							Math.pow((y - centerY) / verticalRadius, 2) +
							Math.pow((z - centerZ) / horizontalRadius, 2),
					);

					if (normalizedDist <= 1) {
						world.setBlock(x, y, z, 1);
					}
				}
			}
		}

		// Fourth pass: Convert top layer to grass
		for (
			let x = centerX - horizontalRadius;
			x <= centerX + horizontalRadius;
			x++
		) {
			for (
				let z = centerZ - horizontalRadius;
				z <= centerZ + horizontalRadius;
				z++
			) {
				for (
					let y = centerY + verticalRadius;
					y >= centerY - verticalRadius;
					y--
				) {
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
		for (
			let x = centerX - horizontalRadius + 4;
			x <= centerX + horizontalRadius - 4;
			x += 2
		) {
			for (
				let z = centerZ - horizontalRadius + 4;
				z <= centerZ + horizontalRadius - 4;
				z += 2
			) {
				// Find the top grass block
				let foundSurface = false;
				for (
					let y = centerY + verticalRadius + 5;
					y >= centerY - verticalRadius - 5;
					y--
				) {
					if (world.getBlock(x, y, z) === 2) {
						// If it's grass
						foundSurface = true;

						// Increase chance of placement and check surrounding area
						if (lcg.float() > 0.96) {
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
								let asset: WorldGenAsset | undefined;
								let oy = -1;

								if (hasTrees && roll < 0.2) {
									asset = lcg.bool()
										? this.assets.treeA
										: lcg.bool()
											? this.assets.treeB
											: this.assets.treeC;
									oy = -4;
								} else if (hasSpruce && roll < 0.3) {
									asset = this.assets.spruceA;
								} else if (hasBushes && roll < 0.7) {
									asset = lcg.bool()
										? this.assets.bushA
										: lcg.bool()
											? this.assets.bushB
											: this.assets.bushC;
									oy = 0;
								} else if (hasRocks && roll < 0.9) {
									asset = lcg.bool()
										? this.assets.rockA
										: lcg.bool()
											? this.assets.rockB
											: this.assets.rockC;
								}

								if (asset) {
									asset.worldBlit(
										world,
										x - asset.w / 2,
										y + oy,
										z - asset.d / 2,
									);
								}
							}
						} else if (lcg.float() > 0.9) {
							// Make sure we have enough space (check block above)
							//if (world.getBlock(x, y + 1, z) === 0) {
							// Choose what to place
							const roll = lcg.float();
							let type: string;

							if (roll < 0.8) {
								type = "grass";
							} else if (roll < 0.9) {
								type = "flower";
							} else if (roll < 0.95) {
								type = "stick";
							} else {
								type = "stone";
							}

							// Create the static object
							y++;
							const chunk = world.getOrGenChunk(x, y, z);
							StaticObject.create(type, chunk, x | 0, y | 0, z | 0);
							//}
						}
						break;
					}
				}

				// Skip rest of column if we found a surface
				if (foundSurface) continue;
			}
		}
	}

	islandStep(
		world: World,
		lcg: LCG,
		x: number,
		y: number,
		z: number,
		size: number,
		step: number,
	) {
		if (size < 8 || lcg.int(0, 6) < step) {
			return;
		}
		for (let cx = x - size; cx < x + size; cx += 8) {
			for (let cy = y - size; cy < y + size; cy += 8) {
				for (let cz = z - size; cz < z + size; cz += 8) {
					if (world.getBlock(cx, cy, cz)) {
						return;
					}
				}
			}
		}

		this.floatingIsland(world, lcg, x, y, z, size);

		const l = (ox: number, oy: number, oz: number) => {
			this.islandStep(
				world,
				lcg,
				ox + lcg.int(size * -0.1, size * 0.1),
				oy + lcg.int(size * -0.5, size * 0.5),
				oz + lcg.int(size * -0.1, size * 0.1),
				size + lcg.int(-20, 10),
				step + 1,
			);
		};

		l(x + (size * 2 + size * 0.4), y, z);
		l(x - (size * 2 + size * 0.4), y, z);
		l(x, y, z + (size * 2 + size * 0.4));
		l(x, y, z - (size * 2 + size * 0.4));
	}

	spawnPos(_player: Character): [number, number, number] {
		return [1000, 1040, 1000];
	}

	preGen(world: World) {
		const lcg = new LCG(world.seed);

		this.islandStep(world, lcg, 1000, 1000, 1000, 50, 0);
	}

	genChunk(_chunk: Chunk) {
		// Empty, we just preGen everything!!!
	}
}
