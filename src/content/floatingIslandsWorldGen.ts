/* Copyright 2024 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * FloatingIslandsWorldGen – procedural world-generator that forges a sky-realm of
 * lush, self-contained islands connected only by thin air. It performs *eager*
 * generation in `preGen`, carving every island up-front using a deterministic
 * Linear Congruential Generator (LCG) seeded from `world.seed` so the same seed
 * always yields the same geography.
 *
 * Typical usage:
 * ```ts
 * const wg = new FloatingIslandsWorldGen();
 * await wg.init();          // ← IMPORTANT – loads .vox assets asynchronously
 * world.setWorldGen(wg);    // engine-specific hook
 * ```
 *
 * Extending the generator:
 *  • Override `floatingIsland` to change the geometry or decoration logic.
 *  • Override `islandStep` for a different recursion / neighbourhood pattern.
 *  • Keep all randomness routed through the provided `LCG` instance to preserve
 *    determinism across clients and servers.
 *
 * Foot-guns & caveats:
 *  1. Forgetting to `await init()` will crash later with "Assets not loaded".
 *  2. `preGen` writes every block immediately – large worlds may exhaust RAM.
 *  3. `world.bottomOfTheWorld` is set to an absolute Y of 900; any gameplay
 *     code that assumes bedrock at 0 must be adjusted.
 *  4. The recursive `islandStep` can explode exponentially if its random early
 *     exit is weakened – profile after tweaking constants.
 *  5. Block IDs are hard-coded literals (e.g. `blocks.grass` resolves to `2`).
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

// It is important to always use an LCG that uses the world seed since only this way
// can we ensure that the worldgen is deterministic and can be reproduced.
import { LCG } from "../util/prng";
import type { Chunk } from "../world/chunk/chunk";
import type { World } from "../world/world";
import type { Character } from "../world/entity/character";
import { blocks } from "./blockTypes";

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

	/**
	 * Asynchronously loads all .vox models required for decoration and stores
	 * them in `this.assets`. **Must** be awaited before any generation begins.
	 */
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

	/**
	 * Advises the engine whether a chunk can be garbage-collected. Currently
	 * returns `false` for every chunk because we cannot yet distinguish empty
	 * sky chunks from populated ones – future optimisation point.
	 */
	mayGC(_chunk: Chunk): boolean {
		// Todo: Determine whether the chunk is an empty sky chunk, then it may GC
		return false;
	}

	/**
	 * Core routine that carves a single island, layers soil & grass, then places
	 * decorative assets. Do not invoke directly from outside – use `islandStep`
	 * so the recursion strategy remains intact.
	 */
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
		const pointyCenterY = centerY - 1; // Position it lower for the pointy bottom

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
						world.setBlock(x, y, z, blocks.stone); // Stone block
					}
				}
			}
		}

		const dirtRadius = horizontalRadius * 1.1;
		const dirtVerticalRadius = verticalRadius * 0.6;

		// Second pass: Generate dirt layer
		for (let x = centerX - dirtRadius; x <= centerX + dirtRadius; x++) {
			for (
				let y = centerY - dirtVerticalRadius;
				y <= centerY + dirtVerticalRadius;
				y++
			) {
				for (let z = centerZ - dirtRadius; z <= centerZ + dirtRadius; z++) {
					const normalizedDist = Math.sqrt(
						Math.pow((x - centerX) / dirtRadius, 2) +
							Math.pow((y - centerY) / dirtVerticalRadius, 2) +
							Math.pow((z - centerZ) / dirtRadius, 2),
					);

					if (normalizedDist <= 1) {
						world.setBlock(x, y, z, blocks.dirt);
					}
				}
			}
		}

		// Fourth pass: Convert top layer to grass
		for (let x = centerX - dirtRadius; x <= centerX + dirtRadius; x++) {
			for (let z = centerZ - dirtRadius; z <= centerZ + dirtRadius; z++) {
				for (
					let y = centerY + dirtVerticalRadius;
					y >= centerY - dirtVerticalRadius;
					y--
				) {
					if (world.getBlock(x, y, z) === blocks.dirt) {
						world.setBlock(x, y, z, blocks.grass);
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

								if (hasTrees && roll < 0.05) {
									asset = lcg.bool()
										? this.assets.treeA
										: lcg.bool()
											? this.assets.treeB
											: this.assets.treeC;
									oy = -4;
								} else if (hasSpruce && roll < 0.1) {
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
						} else if (lcg.float() > 0.997) {
							const distanceFromCenter = Math.sqrt(
								Math.pow(x - centerX, 2) + Math.pow(z - centerZ, 2),
							);
							if (distanceFromCenter < size * 0.5) {
								// Vary pond sizes but keep them reasonable
								const pondWidth = 8 + Math.floor(lcg.float() * 6);
								const pondDepth = 3 + Math.floor(lcg.float() * 3);

								// Create the pond slightly below the island surface
								this.createPond(world, lcg, x, y, z, pondWidth, pondDepth);
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

	/**
	 * Hollows an oval depression and fills it with water surrounded by sandy
	 * shores – a helper called from `floatingIsland`.
	 */
	private createPond(
		world: World,
		lcg: LCG,
		centerX: number,
		centerY: number,
		centerZ: number,
		width: number,
		depth: number,
	) {
		const horizontalRadius = width / 2;
		const verticalRadius = depth;
		const shoreRadius = horizontalRadius + 1;
		const dirtRadius = shoreRadius + 1;

		// First create a dirt/grass foundation
		for (let x = centerX - dirtRadius; x <= centerX + dirtRadius; x++) {
			for (let z = centerZ - dirtRadius; z <= centerZ + dirtRadius; z++) {
				const normalizedDist = Math.sqrt(
					Math.pow((x - centerX) / horizontalRadius, 2) +
						Math.pow((z - centerZ) / horizontalRadius, 2),
				);

				if (normalizedDist <= 1.4) {
					// Check if there's a block above before placing grass
					const hasBlockAbove = (world.getBlock(x, centerY + 1, z) || 0) > 0;

					// Place grass on top if exposed, dirt otherwise
					world.setBlock(
						x,
						centerY,
						z,
						hasBlockAbove ? blocks.dirt : blocks.grass,
					);

					// Always place dirt for lower layers
					world.setBlock(x, centerY - 1, z, blocks.dirt);
					world.setBlock(x, centerY - 2, z, blocks.dirt);
				}
			}
		}

		// Then create sandy shores
		for (let x = centerX - shoreRadius; x <= centerX + shoreRadius; x++) {
			for (let z = centerZ - shoreRadius; z <= centerZ + shoreRadius; z++) {
				const normalizedDist = Math.sqrt(
					Math.pow((x - centerX) / horizontalRadius, 2) +
						Math.pow((z - centerZ) / horizontalRadius, 2),
				);

				if (normalizedDist <= 1.2) {
					world.setBlock(x, centerY, z, blocks.sand);
					world.setBlock(x, centerY - 1, z, blocks.sand);
				}
			}
		}

		// Finally create the pond itself
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
				for (let y = centerY; y >= centerY - verticalRadius; y--) {
					const normalizedDist = Math.sqrt(
						Math.pow((x - centerX) / horizontalRadius, 2) +
							Math.pow((z - centerZ) / horizontalRadius, 2),
					);

					if (normalizedDist <= 1) {
						const depthFactor = (centerY - y) / verticalRadius;

						if (depthFactor > 0.8) {
							const stoneChance = depthFactor * (1 - normalizedDist);
							world.setBlock(
								x,
								y,
								z,
								lcg.float() < stoneChance ? blocks.stone : blocks.sand,
							);
						} else {
							world.setBlock(x, y, z, blocks.sand);
						}

						if (y > centerY - verticalRadius) {
							world.setBlock(x, y, z, blocks.water);
						}
					}
				}
			}
		}
	}

	/**
	 * Recursive driver: places one island and then spawns neighbours of varying
	 * sizes around it. A probabilistic stop condition (`lcg.int(0,6) < step`)
	 * prevents unbounded recursion – tweak with care, it directly impacts memory
	 * and generation time.
	 */
	islandStep(
		world: World,
		lcg: LCG,
		x: number,
		y: number,
		z: number,
		size: number,
		step: number,
	) {
		if (size < 5 || lcg.int(0, 6) < step) {
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
				ox + lcg.int(size * -0.2, size * 0.2),
				oy + lcg.int(size * -0.3, size * 0.3),
				oz + lcg.int(size * -0.2, size * 0.2),
				size + lcg.int(-30, 30),
				step + 1,
			);
		};

		l(x + size * 2.2, y, z);
		l(x - size * 2.2, y, z);
		l(x, y, z + size * 2.2);
		l(x, y, z - size * 2.2);

		const ll = (ox: number, oy: number, oz: number) => {
			this.islandStep(
				world,
				lcg,
				ox + lcg.int(size * -0.1, size * 0.1),
				oy + lcg.int(size * -0.1, size * 0.1),
				oz + lcg.int(size * -0.1, size * 0.1),
				size * 0.3 + lcg.int(-10, 10),
				step + 1,
			);
		};

		ll(x + size * 1.5, y, z + size * 1.5);
		ll(x - size * 1.5, y, z - size * 1.5);
		ll(x + size * 1.5, y, z - size * 1.5);
		ll(x - size * 1.5, y, z + size * 1.5);
	}

	/**
	 * Returns the starting coordinates for new players. Currently hard-coded to
	 * a safe spot near the first island – consider picking the highest grass
	 * block on the main island dynamically in the future.
	 */
	spawnPos(_player: Character): [number, number, number] {
		return [1000, 1040, 1000];
	}

	/**
	 * Performs *all* terrain generation eagerly by invoking `islandStep` once.
	 * Also sets `world.bottomOfTheWorld`.
	 */
	preGen(world: World) {
		const lcg = new LCG(world.seed);
		world.bottomOfTheWorld = 900;

		this.islandStep(world, lcg, 1000, 1000, 1000, 50, 0);
	}

	/**
	 * Intentionally left blank – chunk generation is unnecessary because the
	 * entire world has been pre-generated in `preGen`.
	 */
	genChunk(_chunk: Chunk) {
		// Empty, we just preGen everything!!!
	}
}
