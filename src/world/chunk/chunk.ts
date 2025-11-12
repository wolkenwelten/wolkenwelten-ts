/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Chunk – a 32×32×32 block container
 * ==================================
 * A `Chunk` represents the smallest self–contained volume of mutable world data.
 * All world-space coordinates that share the same upper 27 bits map to the same
 * chunk (i.e. each component is aligned to a multiple of 32).  Every chunk
 * stores its voxel data inside a single `Uint8Array` and keeps lightweight
 * caches such as `lastEmptyCheckResult`.
 *
 * Life-cycle & mutability
 * -----------------------
 * A chunk is **created** by `World.getOrGenChunk()` which immediately fills the
 * `blocks` array via the world-generator when running on the server.  The array
 * is then mutated over time through helper methods on `Chunk` or directly via
 * `World.setBlock()` on the server/client network updates.
 *
 * Each mutation MUST bump `lastUpdated` and invalidate nearby render-meshes via
 * `World.invalidatePosition()`; the convenience wrappers (`setBlock`, `setBox`,
 * `setSphere`) already take care of this.  The low-level *Unsafe* variants
 * intentionally skip these steps – they exist for tight inner-loops during map
 * generation.  Using them elsewhere is a common **foot-gun**: forget to call
 * `invalidate()` and the renderer/lightmap cache will silently go stale.
 *
 * Extending
 * ---------
 * The class is purposely minimal and uses plain `Uint8Array`s for speed.  When
 * subclassing, do NOT replace those arrays – many hot-paths assume identical
 * memory layout.  Instead, keep extra state in your subclass.  If you override
 * mutating helpers, remember to replicate the cache-invalidations mentioned
 * above.
 *
 * Performance notes / pitfalls
 * ----------------------------
 * • `coordinateToOffset()` is heavily inlined – keep it identical when copying.
 * • `isEmpty()` scans the whole block array but caches the result per tick;
 *   make sure to bump `lastUpdated` after *any* modification to preserve
 *   correctness.
 */

import type { Entity } from "../entity/entity";
import type { World } from "../world";

const coordinateToOffset = (x: number, y: number, z: number) =>
	(Math.floor(x) & 0x1f) |
	((Math.floor(y) & 0x1f) * 32) |
	((Math.floor(z) & 0x1f) * 32 * 32);

export class Chunk {
	blocks: Uint8Array;
	lastUpdated: number;
	staticLastUpdated: number;
	loaded = false;
	x: number;
	y: number;
	z: number;
	world: World;

	lastEmptyCheck = -1;
	lastEmptyCheckResult = true;

	constructor(world: World, x: number, y: number, z: number) {
		this.blocks = new Uint8Array(32 * 32 * 32);
		this.x = x;
		this.y = y;
		this.z = z;
		this.world = world;
		this.staticLastUpdated = this.lastUpdated = world.game.ticks;
	}

	/**
	 * Fast emptiness check.
	 * Returns `true` iff every voxel in `blocks` is zero (air).
	 * The expensive scan is executed at most **once per tick** thanks to the
	 * `lastEmptyCheck` cache.  Direct writes to `blocks` or usage of
	 * *Unsafe mutators* must therefore manually invalidate the cache by
	 * bumping `lastUpdated`.
	 */
	isEmpty() {
		if (this.lastEmptyCheck === this.lastUpdated) {
			return this.lastEmptyCheckResult;
		}
		this.lastEmptyCheck = this.lastUpdated;
		for (let i = 0; i < this.blocks.length; i++) {
			if (this.blocks[i] !== 0) {
				this.lastEmptyCheckResult = false;
				return false;
			}
		}
		this.lastEmptyCheckResult = true;
		return true;
	}

	/**
	 * Translate a world-space coordinate inside this chunk into a raw voxel id.
	 * No bounds checking is performed for performance reasons.
	 */
	getBlock(x: number, y: number, z: number): number {
		const i = coordinateToOffset(x, y, z);
		return this.blocks[i];
	}

	/**
	 * Low-level setter used by generation code. **Does NOT**:
	 *   • bump `lastUpdated`
	 *   • notify the world / renderer
	 * Use `setBlock()` instead unless you really know what you are doing.
	 */
	setBlockUnsafe(x: number, y: number, z: number, block: number) {
		const i = coordinateToOffset(x, y, z);
		this.blocks[i] = block;
	}

	/**
	 * Safe wrapper around `setBlockUnsafe` which also updates time-stamps and
	 * invalidates all affected render data.  This is the method that external
	 * gameplay code should call.
	 */
	setBlock(x: number, y: number, z: number, block: number) {
		this.setBlockUnsafe(x, y, z, block);
		this.lastUpdated = this.world.game.ticks;
		this.world.invalidatePosition(x, y, z);
	}

	/**
	 * Fill a rectangular area.  Coordinates are *local* to the chunk and **must
	 * be within 0-31** or the write is skipped for that axis.
	 */
	setBoxUnsafe(
		cx: number,
		cy: number,
		cz: number,
		w: number,
		h: number,
		d: number,
		block: number,
	) {
		for (let x = cx; x < cx + w; x++) {
			const xOff = Math.floor(x) & 0x1f;
			if (x < 0 || x >= 32) {
				continue;
			}
			for (let y = cy; y < cy + h; y++) {
				const yOff = (Math.floor(y) & 0x1f) * 32;
				if (y < 0 || y >= 32) {
					continue;
				}
				for (let z = cz; z < cz + d; z++) {
					if (z < 0 || z >= 32) {
						continue;
					}
					const zOff = (Math.floor(z) & 0x1f) * (32 * 32);
					const off = xOff | yOff | zOff;
					this.blocks[off] = block;
				}
			}
		}
	}

	/**
	 * Safe variant of `setBoxUnsafe` that invalidates all 8 corner positions of
	 * the written cuboid.  Note that this is a heuristic – if you write very
	 * large boxes you may need to adjust the invalidation strategy.
	 */
	setBox(
		cx: number,
		cy: number,
		cz: number,
		w: number,
		h: number,
		d: number,
		block: number,
	) {
		this.setBoxUnsafe(cx, cy, cz, w, h, d, block);
		this.world.invalidatePosition(cx, cy, cz);
		this.world.invalidatePosition(cx, cy, cz + d);
		this.world.invalidatePosition(cx, cy + h, cz);
		this.world.invalidatePosition(cx, cy + h, cz + 1);
		this.world.invalidatePosition(cx + w, cy, cz);
		this.world.invalidatePosition(cx + w, cy, cz + d);
		this.world.invalidatePosition(cx + w, cy + h, cz);
		this.world.invalidatePosition(cx + w, cy + h, cz + 1);
	}

	/**
	 * Fill a sphere with radius `r` (exclusive).  Like the other *Unsafe*
	 * routines, no cache maintenance is performed.
	 */
	setSphereUnsafe(
		cx: number,
		cy: number,
		cz: number,
		r: number,
		block: number,
	) {
		const rrr = r * r;
		for (let x = -r; x <= r; x++) {
			for (let y = -r; y <= r; y++) {
				for (let z = -r; z <= r; z++) {
					const ddd = x * x + y * y + z * z;
					if (rrr > ddd) {
						const tx = x + cx;
						const ty = y + cy;
						const tz = z + cz;
						if (tx < 0 || tx >= 32) {
							continue;
						}
						if (ty < 0 || ty >= 32) {
							continue;
						}
						if (tz < 0 || tz >= 32) {
							continue;
						}
						this.blocks[coordinateToOffset(tx, ty, tz)] = block;
					}
				}
			}
		}
	}

	/**
	 * Safe variant of `setSphereUnsafe` which invalidates six extrema around the
	 * sphere (min/max of each axis).
	 */
	setSphere(cx: number, cy: number, cz: number, r: number, block: number) {
		this.setSphereUnsafe(cx, cy, cz, r, block);
		this.world.invalidatePosition(cx - r, cy, cz);
		this.world.invalidatePosition(cx + r, cy, cz);
		this.world.invalidatePosition(cx, cy - r, cz);
		this.world.invalidatePosition(cx, cy + r, cz);
		this.world.invalidatePosition(cx, cy, cz - r);
		this.world.invalidatePosition(cx, cy, cz + r);
	}

	/**
	 * Determine whether this chunk can be garbage-collected based on the squared
	 * distance to a reference `entity`.  The caller pre-computes the distance
	 * threshold.  Returns `true` if the chunk should be dropped.
	 */
	gc(maxDistance: number, entity: Entity) {
		const dx = this.x - entity.x;
		const dy = this.y - entity.y;
		const dz = this.z - entity.z;
		const d = dx * dx + dy * dy + dz * dz;
		return d > maxDistance;
	}

	/**
	 * Marks the chunk as dirty without changing any voxel data.  Useful for
	 * external systems that perform bulk writes directly on the `blocks` array
	 * and want to signal that caches need a refresh.
	 */
	invalidate() {
		this.lastUpdated = this.world.game.ticks;
	}
}
