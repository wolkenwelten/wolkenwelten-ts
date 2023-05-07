/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * This contains the core meshing functions used by calling meshgenChunk or meshgenVoxelMesh.
 * To do that we need both block and lighting data, when meshing chunks also for all surrounding chunks.
 *
 * First we gather all the data into a single buffer to make subsequent steps simpler.
 * After that we determine which faces are actually visible, so we iterate over all core(32*32*32) blocks
 * and calculate a bitmap which faces need to be output in later stages. Now we can start emitting some triangles,
 * for that we go over the data 6 times, once for each direction, we do this so that we get 6 distinct areas containing
 * only faces pointing in a particular direction, this is important because we can then later only render parts of a buffer,
 * since a lot of triangles can never be seen (for example triangles pointing upwards can never be seen in chunks above the player).
 * While this increases the amount of drawCalls somewhat it seems to have a positive impact on performance constrained devices like a Raspberry PI.
 *
 * The actual meshing is done by slicing the chunk into 32 planes where we proceed to produce 1x1 rects for each blockface that could be seen.
 * After generating these rects we then optimize the plane by trying to enlarge each rect as much as possible. The version used here is quite simple,
 * this is mainly this version produces quite optimized meshes already while still being somewhat fast, it's been a long time since I measured this though,
 * so there might be a lot of gains to be had here.
 *
 * After that we simply create triangles from rects in each plane and put them in the buffer. And when dealing with chunks we also repeat
 * everything for seeThrough blocks, which right now means water. This needs to be separate because we need to draw them after drawing the rest
 * of the world, since otherwise we would for example skip drawing the sand underneath the water since the water is updating the Z-Buffer (maybe this can be optimized
 * away, works quite alright this way though so haven't put that much effort into optimizing this).
 *
 * If you're wondering how we do ambient occlusion, that's happening because for each vertex we use the light values of the 4 blocks
 * facing the current BlockFace. And since we half the lightValue inside blocks instead of setting it to 0 we get a very similar effect.
 * And again there are probably better ways, this is just the first version that I thought of and since it works reasonably well my motivation
 * for optimization here is quite low.
 */
import type { BlockType } from '../../world/blockType';

interface GenArgs {
    blockData: Uint8Array;
    lightData: Uint8Array;
    sideCache: Uint8Array;
    blocks: BlockType[];
    seeThrough: boolean;
    foundSeeThrough: boolean;
}

export interface GenMsg {
    blockData: Uint8Array;
    lightData: Uint8Array;
    blocks: BlockType[];
    lightFinished: boolean;
}

const sideCache = new Uint8Array(32 * 32 * 32);
const vertBuf = new Uint8Array(2 ** 23);
let vertBufEnd = 0;

const outPush = (
    x: number,
    y: number,
    z: number,
    sideAndLight: number,
    tex: number
) => {
    vertBuf[vertBufEnd] = x;
    vertBuf[vertBufEnd + 1] = y;
    vertBuf[vertBufEnd + 2] = z;
    vertBuf[vertBufEnd + 3] = sideAndLight;
    vertBuf[vertBufEnd + 4] = tex;
    vertBufEnd += 5;
};

const blockBufferPosToOffset = (x: number, y: number, z: number): number =>
    x * 34 * 34 + y * 34 + z;

/*
const sides = {
    front: 0,
    back: 1,
    top: 2,
    bottom: 3,
    left: 4,
    right: 5,
};
*/

const addFront = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tex: number,
    light: number
) => {
    const side = 0; // sides.front
    const zd = z + d;

    const aa = ((light << 4) & 0xf0) + ((light >> 4) & 0xf0);
    const ab = (light & 0xf0) + ((light >> 8) & 0xf0);
    if (aa > ab) {
        outPush(x, y, zd, tex, side | ((light << 4) & 0xf0));
        outPush(x + w, y, zd, tex, side | (light & 0xf0));
        outPush(x + w, y + h, zd, tex, side | ((light >> 4) & 0xf0));

        outPush(x + w, y + h, zd, tex, side | ((light >> 4) & 0xf0));
        outPush(x, y + h, zd, tex, side | ((light >> 8) & 0xf0));
        outPush(x, y, zd, tex, side | ((light << 4) & 0xf0));
    } else {
        outPush(x, y + h, zd, tex, side | ((light >> 8) & 0xf0));
        outPush(x, y, zd, tex, side | ((light << 4) & 0xf0));
        outPush(x + w, y, zd, tex, side | (light & 0xf0));

        outPush(x + w, y, zd, tex, side | (light & 0xf0));
        outPush(x + w, y + h, zd, tex, side | ((light >> 4) & 0xf0));
        outPush(x, y + h, zd, tex, side | ((light >> 8) & 0xf0));
    }
};

const addBack = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tex: number,
    light: number
) => {
    const side = 1; // sides.front

    const aa = ((light << 4) & 0xf0) + ((light >> 4) & 0xf0);
    const ab = (light & 0xf0) + ((light >> 8) & 0xf0);
    if (aa > ab) {
        outPush(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
        outPush(x + w, y + h, z, tex, side | ((light >> 4) & 0xf0));
        outPush(x + w, y, z, tex, side | (light & 0xf0));

        outPush(x + w, y, z, tex, side | (light & 0xf0));
        outPush(x, y, z, tex, side | ((light << 4) & 0xf0));
        outPush(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
    } else {
        outPush(x, y, z, tex, side | ((light << 4) & 0xf0));
        outPush(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
        outPush(x + w, y + h, z, tex, side | ((light >> 4) & 0xf0));

        outPush(x + w, y + h, z, tex, side | ((light >> 4) & 0xf0));
        outPush(x + w, y, z, tex, side | (light & 0xf0));
        outPush(x, y, z, tex, side | ((light << 4) & 0xf0));
    }
};

const addTop = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tex: number,
    light: number
) => {
    const side = 2;
    const yh = y + h;

    const aa = ((light << 4) & 0xf0) + ((light >> 4) & 0xf0);
    const ab = (light & 0xf0) + ((light >> 8) & 0xf0);
    if (aa > ab) {
        outPush(x, yh, z, tex, side | ((light << 4) & 0xf0));
        outPush(x, yh, z + d, tex, side | (light & 0xf0));
        outPush(x + w, yh, z + d, tex, side | ((light >> 4) & 0xf0));

        outPush(x + w, yh, z + d, tex, side | ((light >> 4) & 0xf0));
        outPush(x + w, yh, z, tex, side | ((light >> 8) & 0xf0));
        outPush(x, yh, z, tex, side | ((light << 4) & 0xf0));
    } else {
        outPush(x + w, yh, z, tex, side | ((light >> 8) & 0xf0));
        outPush(x, yh, z, tex, side | ((light << 4) & 0xf0));
        outPush(x, yh, z + d, tex, side | (light & 0xf0));

        outPush(x, yh, z + d, tex, side | (light & 0xf0));
        outPush(x + w, yh, z + d, tex, side | ((light >> 4) & 0xf0));
        outPush(x + w, yh, z, tex, side | ((light >> 8) & 0xf0));
    }
};

const addBottom = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tex: number,
    light: number
) => {
    const side = 3;

    const aa = ((light << 4) & 0xf0) + ((light >> 4) & 0xf0);
    const ab = (light & 0xf0) + ((light >> 8) & 0xf0);
    if (aa > ab) {
        outPush(x, y, z, tex, side | ((light << 4) & 0xf0));
        outPush(x + w, y, z, tex, side | (light & 0xf0));
        outPush(x + w, y, z + d, tex, side | ((light >> 4) & 0xf0));

        outPush(x + w, y, z + d, tex, side | ((light >> 4) & 0xf0));
        outPush(x, y, z + d, tex, side | ((light >> 8) & 0xf0));
        outPush(x, y, z, tex, side | ((light << 4) & 0xf0));
    } else {
        outPush(x, y, z + d, tex, side | ((light >> 8) & 0xf0));
        outPush(x, y, z, tex, side | ((light << 4) & 0xf0));
        outPush(x + w, y, z, tex, side | (light & 0xf0));

        outPush(x + w, y, z, tex, side | (light & 0xf0));
        outPush(x + w, y, z + d, tex, side | ((light >> 4) & 0xf0));
        outPush(x, y, z + d, tex, side | ((light >> 8) & 0xf0));
    }
};

const addLeft = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tex: number,
    light: number
) => {
    const side = 4;

    const aa = ((light << 4) & 0xf0) + ((light >> 4) & 0xf0);
    const ab = (light & 0xf0) + ((light >> 8) & 0xf0);
    if (aa > ab) {
        outPush(x, y, z, tex, side | ((light << 4) & 0xf0));
        outPush(x, y, z + d, tex, side | (light & 0xf0));
        outPush(x, y + h, z + d, tex, side | ((light >> 4) & 0xf0));

        outPush(x, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
        outPush(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
        outPush(x, y, z, tex, side | ((light << 4) & 0xf0));
    } else {
        outPush(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
        outPush(x, y, z, tex, side | ((light << 4) & 0xf0));
        outPush(x, y, z + d, tex, side | (light & 0xf0));

        outPush(x, y, z + d, tex, side | (light & 0xf0));
        outPush(x, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
        outPush(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
    }
};

const addRight = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tex: number,
    light: number
) => {
    const side = 5;
    const xw = x + w;

    const aa = ((light << 4) & 0xf0) + ((light >> 4) & 0xf0);
    const ab = (light & 0xf0) + ((light >> 8) & 0xf0);
    if (aa > ab) {
        outPush(xw, y, z, tex, side | ((light << 4) & 0xf0));
        outPush(xw, y + h, z, tex, side | (light & 0xf0));
        outPush(xw, y + h, z + d, tex, side | ((light >> 4) & 0xf0));

        outPush(xw, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
        outPush(xw, y, z + d, tex, side | ((light >> 8) & 0xf0));
        outPush(xw, y, z, tex, side | ((light << 4) & 0xf0));
    } else {
        outPush(xw, y, z + d, tex, side | ((light >> 8) & 0xf0));
        outPush(xw, y, z, tex, side | ((light << 4) & 0xf0));
        outPush(xw, y + h, z, tex, side | (light & 0xf0));

        outPush(xw, y + h, z, tex, side | (light & 0xf0));
        outPush(xw, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
        outPush(xw, y, z + d, tex, side | ((light >> 8) & 0xf0));
    }
};

const calcSideCache = (
    sideCache: Uint8Array,
    blockData: Uint8Array,
    blocks: BlockType[]
) => {
    let sideOff = 0;
    const blockSeeThrough: number[] = [];
    for (let i = 0; i < blocks.length; i++) {
        blockSeeThrough[i] = blocks[i].seeThrough ? 1 : 0;
    }
    sideCache.fill(0);
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                const off = (x + 1) * 34 * 34 + (y + 1) * 34 + (z + 1);

                const cb = blockData[off];
                if (cb) {
                    if (blockSeeThrough[cb]) {
                        let ret = 1 << 6;
                        ret |=
                            blockData[off + 1] !== cb &&
                            blockSeeThrough[blockData[off + 1]]
                                ? 1
                                : 0;
                        ret |=
                            blockData[off - 1] !== cb &&
                            blockSeeThrough[blockData[off - 1]]
                                ? 2
                                : 0;
                        ret |=
                            blockData[off + 34] !== cb &&
                            blockSeeThrough[blockData[off + 34]]
                                ? 4
                                : 0;
                        ret |=
                            blockData[off - 34] !== cb &&
                            blockSeeThrough[blockData[off - 34]]
                                ? 8
                                : 0;
                        ret |=
                            blockData[off + 34 * 34] !== cb &&
                            blockSeeThrough[blockData[off + 34 * 34]]
                                ? 16
                                : 0;
                        ret |=
                            blockData[off - 34 * 34] !== cb &&
                            blockSeeThrough[blockData[off - 34 * 34]]
                                ? 32
                                : 0;
                        sideCache[sideOff] = ret;
                    } else {
                        sideCache[sideOff] =
                            blockSeeThrough[blockData[off + 1]] |
                            (blockSeeThrough[blockData[off - 1]] << 1) |
                            (blockSeeThrough[blockData[off + 34]] << 2) |
                            (blockSeeThrough[blockData[off - 34]] << 3) |
                            (blockSeeThrough[blockData[off + 34 * 34]] << 4) |
                            (blockSeeThrough[blockData[off - 34 * 34]] << 5);
                    }
                }
                sideOff++;
            }
        }
    }
};

class PlaneEntry {
    width = new Uint8Array(32 * 32);
    height = new Uint8Array(32 * 32);
    block = new Uint8Array(32 * 32);
    light = new Uint16Array(32 * 32);

    optimize() {
        for (let x = 31; x >= 0; x--) {
            const xOff = x * 32;
            for (let y = 31; y >= 0; y--) {
                if (this.block[xOff + y] === 0) {
                    continue;
                }
                if (x < 30) {
                    const aOff = xOff + y;
                    const bOff = aOff + 32;
                    if (
                        this.block[aOff] == this.block[bOff] &&
                        this.light[aOff] == this.light[bOff] &&
                        this.width[aOff] == this.width[bOff]
                    ) {
                        this.height[aOff] += this.height[bOff];
                        this.block[bOff] = 0;
                    }
                }
                if (y < 30) {
                    const aOff = xOff + y;
                    const bOff = aOff + 1;
                    if (
                        this.block[aOff] == this.block[bOff] &&
                        this.light[aOff] == this.light[bOff] &&
                        this.height[aOff] == this.height[bOff]
                    ) {
                        this.width[aOff] += this.width[bOff];
                        this.block[bOff] = 0;
                    }
                }
            }
        }
    }
}

const lightLeftRight = (
    lightData: Uint8Array,
    x: number,
    y: number,
    z: number
) => {
    const a = lightData[x * 34 * 34 + y * 34 + z];
    const b = lightData[x * 34 * 34 + (y + 1) * 34 + z];
    const c = lightData[x * 34 * 34 + y * 34 + z + 1];
    const d = lightData[x * 34 * 34 + (y + 1) * 34 + z + 1];
    return Math.min((a + b + c + d) / 4, 15);
};

const lightTopBottom = (
    lightData: Uint8Array,
    x: number,
    y: number,
    z: number
) => {
    const a = lightData[x * 34 * 34 + y * 34 + z];
    const b = lightData[x * 34 * 34 + y * 34 + z + 1];
    const c = lightData[(x + 1) * 34 * 34 + y * 34 + z];
    const d = lightData[(x + 1) * 34 * 34 + y * 34 + z + 1];
    return Math.min((a + b + c + d) / 4, 15);
};

const lightFrontBack = (
    lightData: Uint8Array,
    x: number,
    y: number,
    z: number
) => {
    const a = lightData[x * 34 * 34 + y * 34 + z];
    const b = lightData[x * 34 * 34 + (y + 1) * 34 + z];
    const c = lightData[(x + 1) * 34 * 34 + y * 34 + z];
    const d = lightData[(x + 1) * 34 * 34 + (y + 1) * 34 + z];
    return Math.min((a + b + c + d) / 4, 15);
};

const plane = new PlaneEntry();

const genFront = (args: GenArgs): number => {
    const start = vertBufEnd;
    const { blocks, sideCache, blockData, lightData } = args;
    // First we slice the chunk into many, zero-initialized, planes
    for (let z = 0; z < 32; z++) {
        let found = 0;
        plane.block.fill(0);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if ((side & 1) === 0) {
                    continue;
                }
                if (args.seeThrough === ((side & (1 << 6)) === 0)) {
                    args.foundSeeThrough = true;
                    continue;
                }
                const off = y * 32 + x;
                // Gotta increment our counter so that we don't skip this chunk
                found++;
                plane.width[off] = 1;
                plane.height[off] = 1;
                plane.block[off] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                plane.light[off] =
                    lightFrontBack(lightData, x, y, z + 2) |
                    (lightFrontBack(lightData, x + 1, y, z + 2) << 4) |
                    (lightFrontBack(lightData, x + 1, y + 1, z + 2) << 8) |
                    (lightFrontBack(lightData, x, y + 1, z + 2) << 12);
            }
        }
        // If not a single face can be seen then we can skip this slice
        if (found == 0) {
            continue;
        }
        plane.optimize();
        const cd = 1;
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const off = y * 32 + x;
                if (plane.block[off] === 0) {
                    continue;
                }
                const light = plane.light[off];
                const cw = plane.width[off];
                const ch = plane.height[off];
                const b = blocks[plane.block[off]];
                addFront(x, y, z, cw, ch, cd, b.texFront, light);
            }
        }
    }
    return (vertBufEnd - start) / 5;
};

const genBack = (args: GenArgs) => {
    const start = vertBufEnd;
    const { blocks, sideCache, blockData, lightData } = args;
    for (let z = 0; z < 32; z++) {
        let found = 0;
        plane.block.fill(0);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if ((side & 2) === 0) {
                    continue;
                }
                if (args.seeThrough === ((side & (1 << 6)) === 0)) {
                    args.foundSeeThrough = true;
                    continue;
                }
                const off = y * 32 + x;
                // Gotta increment our counter so that we don't skip this chunk
                found++;
                plane.width[off] = 1;
                plane.height[off] = 1;
                plane.block[off] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                plane.light[off] =
                    lightFrontBack(lightData, x, y, z) |
                    (lightFrontBack(lightData, x + 1, y, z) << 4) |
                    (lightFrontBack(lightData, x + 1, y + 1, z) << 8) |
                    (lightFrontBack(lightData, x, y + 1, z) << 12);
            }
        }
        // If not a single face can be seen then we can skip this slice
        if (found === 0) {
            continue;
        }
        plane.optimize();
        let cd = 1;
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                const off = y * 32 + x;
                if (plane.block[off] === 0) {
                    continue;
                }
                const cw = plane.width[off];
                const ch = plane.height[off];
                const light = plane.light[off];
                const b = blocks[plane.block[off]];
                addBack(x, y, z, cw, ch, cd, b.texBack, light);
            }
        }
    }
    return (vertBufEnd - start) / 5;
};

const genTop = (args: GenArgs) => {
    const start = vertBufEnd;
    const { blocks, sideCache, blockData, lightData } = args;
    for (let y = 0; y < 32; y++) {
        let found = 0;
        plane.block.fill(0);
        for (let z = 0; z < 32; z++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if ((side & 4) === 0) {
                    continue;
                }
                if (args.seeThrough === ((side & (1 << 6)) === 0)) {
                    args.foundSeeThrough = true;
                    continue;
                }
                const off = z * 32 + x;
                // Gotta increment our counter so that we don't skip this chunk
                found++;
                plane.width[off] = 1;
                plane.height[off] = 1;
                plane.block[off] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                plane.light[off] =
                    lightTopBottom(lightData, x, y + 2, z) |
                    (lightTopBottom(lightData, x, y + 2, z + 1) << 4) |
                    (lightTopBottom(lightData, x + 1, y + 2, z + 1) << 8) |
                    (lightTopBottom(lightData, x + 1, y + 2, z) << 12);
            }
        }
        // If not a single face can be seen then we can skip this slice
        if (found === 0) {
            continue;
        }
        plane.optimize();
        const ch = 1;
        for (let z = 0; z < 32; z++) {
            for (let x = 0; x < 32; x++) {
                const off = z * 32 + x;
                if (plane.block[off] === 0) {
                    continue;
                }
                const cw = plane.width[off];
                const cd = plane.height[off];
                const light = plane.light[off];
                const b = blocks[plane.block[off]];
                addTop(x, y, z, cw, ch, cd, b.texTop, light);
            }
        }
    }
    return (vertBufEnd - start) / 5;
};

const genBottom = (args: GenArgs) => {
    const start = vertBufEnd;
    const { blocks, sideCache, blockData, lightData } = args;
    for (let y = 0; y < 32; y++) {
        let found = 0;
        plane.block.fill(0);
        for (let z = 0; z < 32; z++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if ((side & 8) === 0) {
                    continue;
                }
                if (args.seeThrough === ((side & (1 << 6)) === 0)) {
                    args.foundSeeThrough = true;
                    continue;
                }
                const off = z * 32 + x;
                // Gotta increment our counter so that we don't skip this chunk
                found++;
                plane.width[off] = 1;
                plane.height[off] = 1;
                plane.block[off] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                plane.light[off] =
                    lightTopBottom(lightData, x, y, z) |
                    (lightTopBottom(lightData, x + 1, y, z) << 4) |
                    (lightTopBottom(lightData, x + 1, y, z + 1) << 8) |
                    (lightTopBottom(lightData, x, y, z + 1) << 12);
            }
        }
        // If not a single face can be seen then we can skip this slice
        if (found === 0) {
            continue;
        }
        plane.optimize();
        const ch = 1;
        for (let z = 0; z < 32; z++) {
            for (let x = 0; x < 32; x++) {
                const off = z * 32 + x;
                if (plane.block[off] === 0) {
                    continue;
                }
                const cw = plane.width[off];
                const cd = plane.height[off];
                const light = plane.light[off];
                const b = blocks[plane.block[off]];
                addBottom(x, y, z, cw, ch, cd, b.texBottom, light);
            }
        }
    }
    return (vertBufEnd - start) / 5;
};

const genRight = (args: GenArgs) => {
    const start = vertBufEnd;
    const { blocks, sideCache, blockData, lightData } = args;
    for (let x = 0; x < 32; x++) {
        let found = 0;
        plane.block.fill(0);
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if ((side & 16) === 0) {
                    continue;
                }
                if (args.seeThrough === ((side & (1 << 6)) === 0)) {
                    args.foundSeeThrough = true;
                    continue;
                }
                const off = y * 32 + z;
                // Gotta increment our counter so that we don't skip this chunk
                found++;
                plane.width[off] = 1;
                plane.height[off] = 1;
                plane.block[off] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                plane.light[off] =
                    lightLeftRight(lightData, x + 2, y, z) |
                    (lightLeftRight(lightData, x + 2, y + 1, z) << 4) |
                    (lightLeftRight(lightData, x + 2, y + 1, z + 1) << 8) |
                    (lightLeftRight(lightData, x + 2, y, z + 1) << 12);
            }
        }
        // If not a single face can be seen then we can skip this slice
        if (found === 0) {
            continue;
        }
        plane.optimize();
        let cw = 1;
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                const off = y * 32 + z;
                if (plane.block[off] === 0) {
                    continue;
                }
                const cd = plane.width[off];
                const ch = plane.height[off];
                const light = plane.light[off];
                const b = blocks[plane.block[off]];
                addRight(x, y, z, cw, ch, cd, b.texLeft, light);
            }
        }
    }
    return (vertBufEnd - start) / 5;
};

const genLeft = (args: GenArgs) => {
    const start = vertBufEnd;
    const { blocks, sideCache, blockData, lightData } = args;
    for (let x = 0; x < 32; x++) {
        let found = 0;
        plane.block.fill(0);
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if ((side & 32) === 0) {
                    continue;
                }
                if (args.seeThrough === ((side & (1 << 6)) === 0)) {
                    args.foundSeeThrough = true;
                    continue;
                }
                const off = y * 32 + z;
                // Gotta increment our counter so that we don't skip this chunk
                found++;
                plane.width[off] = 1;
                plane.height[off] = 1;
                plane.block[off] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                plane.light[off] =
                    lightLeftRight(lightData, x, y, z) |
                    (lightLeftRight(lightData, x, y, z + 1) << 4) |
                    (lightLeftRight(lightData, x, y + 1, z + 1) << 8) |
                    (lightLeftRight(lightData, x, y + 1, z) << 12);
            }
        }
        // If not a single face can be seen then we can skip this slice
        if (found === 0) {
            continue;
        }
        plane.optimize();
        const cw = 1;
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                const off = y * 32 + z;
                if (plane.block[off] === 0) {
                    continue;
                }
                const cd = plane.width[off];
                const ch = plane.height[off];
                const light = plane.light[off];
                const b = blocks[plane.block[off]];
                addLeft(x, y, z, cw, ch, cd, b.texRight, light);
            }
        }
    }
    return (vertBufEnd - start) / 5;
};

/* This has 3 separate functions bluring XYZ separately combined,
 * it also blurs back and forth at once, while this is not particularly
 * readable, it does result in somewhat faster code (~12% speedup in my measurements on V8/Chrome)
 */
const lightBlur = (out: Uint8Array) => {
    for (let y = 0; y < 34; y++) {
        for (let z = 0; z < 34; z++) {
            let a = 0;
            let b = 0;
            for (let x = 0; x < 34; x++) {
                const aOff = x * 34 * 34 + y * 34 + z;
                a = Math.max(a, out[aOff]);
                out[aOff] = a;
                a = Math.max(0, a - 1);

                const bx = 33 - x;
                const bOff = bx * 34 * 34 + y * 34 + z;
                b = Math.max(b, out[bOff]);
                out[bOff] = b;
                b = Math.max(0, b - 1);
            }
        }
    }

    for (let x = 0; x < 34; x++) {
        for (let z = 0; z < 34; z++) {
            let a = 0;
            let b = 0;
            for (let y = 0; y < 34; y++) {
                const aOff = x * 34 * 34 + y * 34 + z;
                a = Math.max(a, out[aOff]);
                out[aOff] = a;
                a = Math.max(0, a - 1);

                const by = 33 - y;
                const bOff = x * 34 * 34 + by * 34 + z;
                b = Math.max(b, out[bOff]);
                out[bOff] = b;
                b = Math.max(0, b - 1);
            }
        }
    }

    for (let x = 0; x < 34; x++) {
        for (let y = 0; y < 34; y++) {
            let a = 0;
            let b = 0;
            for (let z = 0; z < 34; z++) {
                const aOff = x * 34 * 34 + y * 34 + z;
                a = Math.max(a, out[aOff]);
                out[aOff] = a;
                a = Math.max(0, a - 1);

                const bz = 33 - z;
                const bOff = x * 34 * 34 + y * 34 + bz;
                b = Math.max(b, out[bOff]);
                out[bOff] = b;
                b = Math.max(0, b - 1);
            }
        }
    }
};

const ambientOcclusion = (out: Uint8Array, blocks: Uint8Array) => {
    const end = 34 * 34 * 34;
    for (let off = 0; off < end; off++) {
        // Here we divide the light value by 2 when the position is occupied by a block
        // Written this way so it's branchless and easier to optimize/vectorize
        if (blocks[off]) {
            out[off] = out[off] / 2;
        }
    }
};

export const meshgenReal = ({
    blockData,
    lightData,
    blocks,
    lightFinished,
}: GenMsg): [Uint8Array, number[]] => {
    vertBufEnd = 0;
    calcSideCache(sideCache, blockData, blocks);
    if (!lightFinished) {
        lightBlur(lightData);
    }
    ambientOcclusion(lightData, blockData);

    const sideVertCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let data = {
        blockData,
        lightData,
        sideCache,
        blocks,
        seeThrough: false,
        foundSeeThrough: false,
    };

    sideVertCount[0] = genFront(data);
    sideVertCount[1] = genBack(data);
    sideVertCount[2] = genTop(data);
    sideVertCount[3] = genBottom(data);
    sideVertCount[4] = genLeft(data);
    sideVertCount[5] = genRight(data);

    if (data.foundSeeThrough) {
        data.seeThrough = true;
        sideVertCount[6] = genFront(data);
        sideVertCount[7] = genBack(data);
        sideVertCount[8] = genTop(data);
        sideVertCount[9] = genBottom(data);
        sideVertCount[10] = genLeft(data);
        sideVertCount[11] = genRight(data);
    }
    return [vertBuf.subarray(0, vertBufEnd), sideVertCount];
};
