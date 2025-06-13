/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * WorldGenAsset – a self-contained *voxel prefab*
 * =================================================
 * This utility wraps a small (<32³) set of voxels that can be stamped into the
 * world for e.g. structures, decals, trees … you name it.  It is intentionally
 * dumb and allocation-free at runtime: the heavy lifting (reading the Magica
 * Voxel `.vox` format, colour mapping, bounds checking) is done once in
 * `WorldGenAsset.load()` and the result is just three numbers (w,h,d) plus a
 * flat `Uint8Array`.
 *
 * Coordinate system / axis confusion 🤯
 * ------------------------------------
 * Be aware that **MagicaVoxel uses `x → right`, `y → up`, `z → forward`** –
 * while our engine stores chunks as `width(x) × height(y) × depth(z)`.
 * The loader therefore *swizzles* the axes into `(w = y, h = z, d = x)` to get
 * a nicer orientation when placing the model in-game.  If you rely on a
 * specific orientation, verify it in a test world first!
 *
 * Palette mapping 🎨
 * ------------------
 * `WorldGenAsset` stores *logical* palette indices (1…n) inside `data` – `0`
 * is always air.  When blitting, the index is converted into a **block id**
 * via the user supplied `palette` array.  Make sure the palette covers *all*
 * colours used in the vox file or you will end up with `undefined` voxels ↯.
 *
 * Performance contract ⚡
 * -----------------------
 * • `blitUnsafe` writes directly into a `Chunk` without any safety nets.  You
 *   MUST call `Chunk.invalidate()` afterwards (or use the safe `blit` helper).
 * • `worldBlit` figures out all affected chunks and invalidates them for you –
 *   but it is still synchronous; do not call it from a hot render loop.
 *
 * Extending 💡
 * -----------
 * The class is *deliberately* tiny.  If you need additional per-asset data,
 * create a wrapper that **contains** a `WorldGenAsset` instead of subclassing
 * it – many engine internals assume the exact memory layout shown below.
 */
import readVox from "vox-reader";
import type { Chunk } from "./chunk/chunk";
import type { World } from "./world";
import { isServer } from "../util/compat";

export class WorldGenAsset {
	w: number;
	h: number;
	d: number;
	data: Uint8Array;
	palette: number[];

	constructor(
		w: number,
		h: number,
		d: number,
		data: Uint8Array,
		palette: number[],
	) {
		this.w = w;
		this.h = h;
		this.d = d;
		this.data = data;
		this.palette = palette;
	}

	/**
	 * Load a MagicaVoxel `.vox` file and convert it into a `WorldGenAsset`.
	 *
	 * @param href   On *client*: URL to fetch.  On *server*: already loaded
	 *               `Uint8Array` (the type is abused here for convenience).
	 * @param palette Array mapping *logical* palette indices (1-based) to actual
	 *               **block ids** in the current `World`.  `palette[0]` → colour
	 *               index 1 in the model, *etc.*  Missing entries silently
	 *               resolve to `undefined` ⇒ air.
	 * @returns      Promise that resolves to a ready-to-use asset.
	 *
	 * Footguns 🔫
	 * -----------
	 * • The asset dimensions are clamped to 32³; bigger files throw.
	 * • The axis swizzle `(w = y, h = z, d = x)` might not match your mental
	 *   model – keep it in mind when calculating offsets.
	 */
	static load(href: string, palette: number[]): Promise<WorldGenAsset> {
		return new Promise((resolve) => {
			setTimeout(async () => {
				const data = isServer()
					? (href as unknown as Uint8Array)
					: new Uint8Array(await (await fetch(href)).arrayBuffer());

				const voxData = readVox(data);
				const size = voxData.size;
				if (
					size.x > 32 ||
					size.y > 32 ||
					size.z > 32 ||
					size.x <= 0 ||
					size.y <= 0 ||
					size.z <= 0
				) {
					throw new Error(`Invalid .vox file: ${href}`);
				}
				const tmpBlocks = new Uint8Array(size.x * size.y * size.z);
				const lut = new Map();
				for (const { x, y, z, i } of voxData.xyzi.values) {
					const off = y * size.x * size.z + z * size.x + x;
					let li = lut.get(i);
					if (!li) {
						li = lut.size + 1;
						lut.set(i, li);
					}
					tmpBlocks[off] = li;
				}
				resolve(new WorldGenAsset(size.y, size.z, size.x, tmpBlocks, palette));
			}, 0);
		});
	}

	/**
	 * Ultra-fast copier used by generation code.
	 *
	 * Write the asset into an existing **chunk-local** coordinate space without
	 * performing *any* safety checks or cache invalidations.  The caller is
	 * responsible for ensuring the write window lies within `[0,31]³` and for
	 * calling `chunk.invalidate()` afterwards.
	 *
	 * Use `blit()` or `worldBlit()` unless you are on a critical code path and
	 * absolutely sure what you are doing!
	 */
	blitUnsafe(out: Chunk, tx: number, ty: number, tz: number) {
		for (let x = 0; x < this.w; x++) {
			const cx = x + tx;
			if (cx < 0 || cx >= 32) continue;
			for (let y = 0; y < this.h; y++) {
				const cy = y + ty;
				if (cy < 0 || cy >= 32) continue;
				for (let z = 0; z < this.d; z++) {
					const cz = z + tz;
					if (cz < 0 || cz >= 32) continue;

					// Calculate the buffer position dynamically
					const off = z + y * this.d + x * this.d * this.h;
					const i = this.data[off];
					if (i) {
						out.setBlockUnsafe(cx, cy, cz, this.palette[i - 1]);
					}
				}
			}
		}
	}

	/**
	 * Safe variant of `blitUnsafe` for single-chunk writes.
	 *
	 * After copying the data, the target chunk is invalidated so that light &
	 * render caches are refreshed automatically.
	 */
	blit(out: Chunk, x: number, y: number, z: number) {
		this.blitUnsafe(out, x, y, z);
		out.invalidate();
	}

	/**
	 * Stamp the asset into *world coordinates* – neighbouring chunks are created
	 * on-demand and invalidated.
	 *
	 * This is the helper you want for most gameplay/world-gen scenarios.  Still
	 * synchronous; run it in a web-worker or during load screens if the model is
	 * large.
	 */
	worldBlit(out: World, x: number, y: number, z: number) {
		// Calculate the affected chunk coordinates
		const startChunkX = x >> 5;
		const startChunkY = y >> 5;
		const startChunkZ = z >> 5;
		const endChunkX = (x + this.w - 1) >> 5;
		const endChunkY = (y + this.h - 1) >> 5;
		const endChunkZ = (z + this.d - 1) >> 5;

		// Iterate through all affected chunks
		for (let cx = startChunkX; cx <= endChunkX; cx++) {
			for (let cy = startChunkY; cy <= endChunkY; cy++) {
				for (let cz = startChunkZ; cz <= endChunkZ; cz++) {
					// Get or create the chunk
					const chunk = out.getOrGenChunk(cx * 32, cy * 32, cz * 32);
					if (!chunk) continue;

					// Calculate local coordinates within this chunk
					const localX = x - cx * 32;
					const localY = y - cy * 32;
					const localZ = z - cz * 32;

					// Blit to this chunk
					this.blitUnsafe(chunk, localX, localY, localZ);
					chunk.invalidate();
				}
			}
		}
	}

	/**
	 * Quick bounds check: does the asset fit entirely inside `out` when placed
	 * at `(x,y,z)`?  Useful for collision/pre-placement tests.
	 */
	fits(out: Chunk, x: number, y: number, z: number) {
		return x + this.w < 32 && y + this.h < 32 && z + this.d < 32;
	}
}
