/* Copyright 2024 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import readVox from "vox-reader";
import type { Chunk } from "./chunk/chunk";
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

	static load(href: string, palette: number[]): Promise<WorldGenAsset> {
		return new Promise((resolve) => {
			setTimeout(async () => {
				if (isServer()) {
					// ToDo: Actually load the asset
					resolve(new WorldGenAsset(0, 0, 0, new Uint8Array(0), []));
					return;
				}
				const data = new Uint8Array(await (await fetch(href)).arrayBuffer());
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

	blitUnsafe(out: Chunk, tx: number, ty: number, tz: number) {
		let off = 0;
		for (let x = 0; x < this.w; x++) {
			const cx = x + tx;
			for (let y = 0; y < this.h; y++) {
				const cy = y + ty;
				for (let z = 0; z < this.d; z++) {
					const i = this.data[off++];
					if (i) {
						const cz = z + tz;
						out.setBlockUnsafe(cx, cy, cz, this.palette[i - 1]);
					}
				}
			}
		}
	}

	blit(out: Chunk, x: number, y: number, z: number) {
		this.blitUnsafe(out, x, y, z);
		out.invalidate();
	}

	fits(out: Chunk, x: number, y: number, z: number) {
		return x + this.w < 32 && y + this.h < 32 && z + this.d < 32;
	}
}
