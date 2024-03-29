/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import readVox from 'vox-reader';

import voxBushA from '../../../assets/wg/bush_a.vox?url';
import voxBushB from '../../../assets/wg/bush_b.vox?url';
import voxBushC from '../../../assets/wg/bush_c.vox?url';
import voxRockA from '../../../assets/wg/rock_a.vox?url';
import voxRockB from '../../../assets/wg/rock_b.vox?url';
import voxRockC from '../../../assets/wg/rock_c.vox?url';
import voxSpruceA from '../../../assets/wg/spruce_a.vox?url';
import voxTreeA from '../../../assets/wg/tree_a.vox?url';
import voxTreeB from '../../../assets/wg/tree_b.vox?url';
import voxTreeC from '../../../assets/wg/tree_c.vox?url';

import type { Chunk } from '../../world/chunk/chunk';
import { worldgen } from './worldgen';
import { isServer } from '../../util/compat';

class WorldgenAsset {
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
        palette: number[]
    ) {
        this.w = w;
        this.h = h;
        this.d = d;
        this.data = data;
        this.palette = palette;
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

export interface WorldgenAssetList {
    bushA: WorldgenAsset;
    bushB: WorldgenAsset;
    bushC: WorldgenAsset;

    rockA: WorldgenAsset;
    rockB: WorldgenAsset;
    rockC: WorldgenAsset;

    treeA: WorldgenAsset;
    treeB: WorldgenAsset;
    treeC: WorldgenAsset;

    spruceA: WorldgenAsset;
}

const loadAsset = (href: string, palette: number[]): Promise<WorldgenAsset> => {
    return new Promise((resolve) => {
        setTimeout(async () => {
            if (isServer()) {
                // ToDo: Actually load the asset
                resolve(new WorldgenAsset(0, 0, 0, new Uint8Array(0), []));
                return;
            }
            const data = new Uint8Array(
                await (await fetch(href)).arrayBuffer()
            );
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
            resolve(
                new WorldgenAsset(size.y, size.z, size.x, tmpBlocks, palette)
            );
        }, 0);
    });
};

export const initWorldgen = async () => {
    const assets = {
        bushA: await loadAsset(voxBushA, [5, 6]),
        bushB: await loadAsset(voxBushB, [6, 10]),
        bushC: await loadAsset(voxBushC, [6, 5]),

        rockA: await loadAsset(voxRockA, [3]),
        rockB: await loadAsset(voxRockB, [3, 4]),
        rockC: await loadAsset(voxRockC, [3, 12]),

        treeA: await loadAsset(voxTreeA, [5, 11]),
        treeB: await loadAsset(voxTreeB, [5, 11]),
        treeC: await loadAsset(voxTreeC, [5, 11]),

        spruceA: await loadAsset(voxSpruceA, [5, 11]),
    };
    return (chunk: Chunk) => worldgen(assets, chunk);
};
