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
import profiler from '../../profiler';
import type { Chunk } from '../../world/chunk/chunk';
import { clamp } from '../../util/math';
import { BlockType } from '../../world/blockType';
import { lightGenSimple } from '../../world/chunk/lightGen';

const createIdentityBlocks = () => {
    const ret = [];
    ret.push(new BlockType(0, 'Void').withInvisible());
    for (let i = 1; i < 256; i++) {
        ret.push(new BlockType(i, '').withTexture(i - 1));
    }
    return ret;
};

const blockData = new Uint8Array(34 * 34 * 34);
const lightData = new Uint8Array(34 * 34 * 34);
const sideCache = new Uint8Array(32 * 32 * 32);
const tmpSimpleLight = new Uint8Array(32 * 32 * 32);
const identityBlocks = createIdentityBlocks();

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
    out: number[],
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
        out.push(x, y, zd, tex, side | ((light << 4) & 0xf0));
        out.push(x + w, y, zd, tex, side | (light & 0xf0));
        out.push(x + w, y + h, zd, tex, side | ((light >> 4) & 0xf0));

        out.push(x + w, y + h, zd, tex, side | ((light >> 4) & 0xf0));
        out.push(x, y + h, zd, tex, side | ((light >> 8) & 0xf0));
        out.push(x, y, zd, tex, side | ((light << 4) & 0xf0));
    } else {
        out.push(x, y + h, zd, tex, side | ((light >> 8) & 0xf0));
        out.push(x, y, zd, tex, side | ((light << 4) & 0xf0));
        out.push(x + w, y, zd, tex, side | (light & 0xf0));

        out.push(x + w, y, zd, tex, side | (light & 0xf0));
        out.push(x + w, y + h, zd, tex, side | ((light >> 4) & 0xf0));
        out.push(x, y + h, zd, tex, side | ((light >> 8) & 0xf0));
    }
};

const addBack = (
    out: number[],
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
        out.push(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
        out.push(x + w, y + h, z, tex, side | ((light >> 4) & 0xf0));
        out.push(x + w, y, z, tex, side | (light & 0xf0));

        out.push(x + w, y, z, tex, side | (light & 0xf0));
        out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
        out.push(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
    } else {
        out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
        out.push(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
        out.push(x + w, y + h, z, tex, side | ((light >> 4) & 0xf0));

        out.push(x + w, y + h, z, tex, side | ((light >> 4) & 0xf0));
        out.push(x + w, y, z, tex, side | (light & 0xf0));
        out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
    }
};

const addTop = (
    out: number[],
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
        out.push(x, yh, z, tex, side | ((light << 4) & 0xf0));
        out.push(x, yh, z + d, tex, side | (light & 0xf0));
        out.push(x + w, yh, z + d, tex, side | ((light >> 4) & 0xf0));

        out.push(x + w, yh, z + d, tex, side | ((light >> 4) & 0xf0));
        out.push(x + w, yh, z, tex, side | ((light >> 8) & 0xf0));
        out.push(x, yh, z, tex, side | ((light << 4) & 0xf0));
    } else {
        out.push(x + w, yh, z, tex, side | ((light >> 8) & 0xf0));
        out.push(x, yh, z, tex, side | ((light << 4) & 0xf0));
        out.push(x, yh, z + d, tex, side | (light & 0xf0));

        out.push(x, yh, z + d, tex, side | (light & 0xf0));
        out.push(x + w, yh, z + d, tex, side | ((light >> 4) & 0xf0));
        out.push(x + w, yh, z, tex, side | ((light >> 8) & 0xf0));
    }
};

const addBottom = (
    out: number[],
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
        out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
        out.push(x + w, y, z, tex, side | (light & 0xf0));
        out.push(x + w, y, z + d, tex, side | ((light >> 4) & 0xf0));

        out.push(x + w, y, z + d, tex, side | ((light >> 4) & 0xf0));
        out.push(x, y, z + d, tex, side | ((light >> 8) & 0xf0));
        out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
    } else {
        out.push(x, y, z + d, tex, side | ((light >> 8) & 0xf0));
        out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
        out.push(x + w, y, z, tex, side | (light & 0xf0));

        out.push(x + w, y, z, tex, side | (light & 0xf0));
        out.push(x + w, y, z + d, tex, side | ((light >> 4) & 0xf0));
        out.push(x, y, z + d, tex, side | ((light >> 8) & 0xf0));
    }
};

const addLeft = (
    out: number[],
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
        out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
        out.push(x, y, z + d, tex, side | (light & 0xf0));
        out.push(x, y + h, z + d, tex, side | ((light >> 4) & 0xf0));

        out.push(x, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
        out.push(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
        out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
    } else {
        out.push(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
        out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
        out.push(x, y, z + d, tex, side | (light & 0xf0));

        out.push(x, y, z + d, tex, side | (light & 0xf0));
        out.push(x, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
        out.push(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
    }
};

const addRight = (
    out: number[],
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
        out.push(xw, y, z, tex, side | ((light << 4) & 0xf0));
        out.push(xw, y + h, z, tex, side | (light & 0xf0));
        out.push(xw, y + h, z + d, tex, side | ((light >> 4) & 0xf0));

        out.push(xw, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
        out.push(xw, y, z + d, tex, side | ((light >> 8) & 0xf0));
        out.push(xw, y, z, tex, side | ((light << 4) & 0xf0));
    } else {
        out.push(xw, y, z + d, tex, side | ((light >> 8) & 0xf0));
        out.push(xw, y, z, tex, side | ((light << 4) & 0xf0));
        out.push(xw, y + h, z, tex, side | (light & 0xf0));

        out.push(xw, y + h, z, tex, side | (light & 0xf0));
        out.push(xw, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
        out.push(xw, y, z + d, tex, side | ((light >> 8) & 0xf0));
    }
};

const blockBufferPosToOffset = (x: number, y: number, z: number): number =>
    x * 34 * 34 + y * 34 + z;

const blitChunkData = (
    blockData: Uint8Array,
    chunkData: Uint8Array,
    offX: number,
    offY: number,
    offZ: number
) => {
    const xStart = clamp(offX, 0, 34);
    const xEnd = clamp(offX + 32, 0, 34);
    const yStart = clamp(offY, 0, 34);
    const yEnd = clamp(offY + 32, 0, 34);
    const zStart = clamp(offZ, 0, 34);
    const zEnd = clamp(offZ + 32, 0, 34);
    for (let x = xStart; x < xEnd; x++) {
        const cx = x - offX;
        for (let y = yStart; y < yEnd; y++) {
            const cy = y - offY;
            let blockOff = x * 34 * 34 + y * 34 + zStart;
            const cz = zStart - offZ;
            let chunkOff = cz * 32 * 32 + cy * 32 + cx; // Transposing the X and Z axes shouldn't be necessary
            for (let z = zStart; z < zEnd; z++) {
                blockData[blockOff++] = chunkData[chunkOff];
                chunkOff += 32 * 32;
            }
        }
    }
};

const calcSideCache = (
    sideCache: Uint8Array,
    blockData: Uint8Array,
    blocks: BlockType[]
) => {
    let sideOff = 0;
    const blockSeeThrough = [];
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

interface GenArgs {
    blockData: Uint8Array;
    lightData: Uint8Array;
    sideCache: Uint8Array;
    blocks: BlockType[];
    seeThrough: boolean;
}

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

const genFront = (vertices: number[], args: GenArgs): number => {
    const start = vertices.length;
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
                if (
                    (side & 1) === 0 ||
                    args.seeThrough === ((side & (1 << 6)) === 0)
                ) {
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
                addFront(vertices, x, y, z, cw, ch, cd, b.texFront, light);
            }
        }
    }
    return (vertices.length - start) / 5;
};

const genBack = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { blocks, sideCache, blockData, lightData } = args;
    for (let z = 0; z < 32; z++) {
        let found = 0;
        plane.block.fill(0);
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if (
                    (side & 2) === 0 ||
                    args.seeThrough === ((side & (1 << 6)) === 0)
                ) {
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
                addBack(vertices, x, y, z, cw, ch, cd, b.texBack, light);
            }
        }
    }
    return (vertices.length - start) / 5;
};

const genTop = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { blocks, sideCache, blockData, lightData } = args;
    for (let y = 0; y < 32; y++) {
        let found = 0;
        plane.block.fill(0);
        for (let z = 0; z < 32; z++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if (
                    (side & 4) === 0 ||
                    args.seeThrough === ((side & (1 << 6)) === 0)
                ) {
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
                addTop(vertices, x, y, z, cw, ch, cd, b.texTop, light);
            }
        }
    }
    return (vertices.length - start) / 5;
};

const genBottom = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { blocks, sideCache, blockData, lightData } = args;
    for (let y = 0; y < 32; y++) {
        let found = 0;
        plane.block.fill(0);
        for (let z = 0; z < 32; z++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if (
                    (side & 8) === 0 ||
                    args.seeThrough === ((side & (1 << 6)) === 0)
                ) {
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
                addBottom(vertices, x, y, z, cw, ch, cd, b.texBottom, light);
            }
        }
    }
    return (vertices.length - start) / 5;
};

const genRight = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { blocks, sideCache, blockData, lightData } = args;
    for (let x = 0; x < 32; x++) {
        let found = 0;
        plane.block.fill(0);
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if (
                    (side & 16) === 0 ||
                    args.seeThrough === ((side & (1 << 6)) === 0)
                ) {
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
                addRight(vertices, x, y, z, cw, ch, cd, b.texLeft, light);
            }
        }
    }
    return (vertices.length - start) / 5;
};

const genLeft = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { blocks, sideCache, blockData, lightData } = args;
    for (let x = 0; x < 32; x++) {
        let found = 0;
        plane.block.fill(0);
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const side = sideCache[x * 32 * 32 + y * 32 + z];
                if (
                    (side & 32) === 0 ||
                    args.seeThrough === ((side & (1 << 6)) === 0)
                ) {
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
                addLeft(vertices, x, y, z, cw, ch, cd, b.texRight, light);
            }
        }
    }
    return (vertices.length - start) / 5;
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

const finishLight = (light: Uint8Array, block: Uint8Array) => {
    const start = performance.now();
    lightBlur(light);
    ambientOcclusion(light, block);
    const end = performance.now();
    profiler.add('finishLight', start, end);
    return light;
};

export const meshgenVoxelMesh = (blocks: Uint8Array): [Uint8Array, number] => {
    const start = performance.now();
    const vertices: number[] = [];
    lightData.fill(15);
    lightGenSimple(tmpSimpleLight, blocks);
    blitChunkData(blockData, blocks, 1, 1, 1);
    blitChunkData(lightData, tmpSimpleLight, 1, 1, 1);
    calcSideCache(sideCache, blockData, identityBlocks);

    const data = {
        blockData,
        lightData,
        sideCache,
        blocks: identityBlocks,
        seeThrough: false,
    };
    ambientOcclusion(lightData, blockData);

    let elementCount = genFront(vertices, data);
    elementCount += genBack(vertices, data);
    elementCount += genTop(vertices, data);
    elementCount += genBottom(vertices, data);
    elementCount += genLeft(vertices, data);
    elementCount += genRight(vertices, data);

    const vertArr = new Uint8Array(vertices);
    profiler.add('meshgenSimple', start, performance.now());
    return [vertArr, elementCount];
};

export const meshgenChunk = (chunk: Chunk): [Uint8Array, number[]] => {
    const start = performance.now();
    const vertices: number[] = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                const cx = chunk.x + x * 32;
                const cy = chunk.y + y * 32;
                const cz = chunk.z + z * 32;
                const curChunk = chunk.world.getOrGenChunk(cx, cy, cz);
                curChunk.updateSimpleLight();
                blitChunkData(
                    blockData,
                    curChunk.blocks,
                    1 + x * 32,
                    1 + y * 32,
                    1 + z * 32
                );
                blitChunkData(
                    lightData,
                    curChunk.simpleLight,
                    1 + x * 32,
                    1 + y * 32,
                    1 + z * 32
                );
            }
        }
    }
    calcSideCache(sideCache, blockData, chunk.world.blocks);
    finishLight(lightData, blockData);

    const sideSquareCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const data = {
        blockData,
        lightData,
        sideCache,
        blocks: chunk.world.blocks,
        seeThrough: false,
    };

    sideSquareCount[0] = genFront(vertices, data);
    sideSquareCount[1] = genBack(vertices, data);
    sideSquareCount[2] = genTop(vertices, data);
    sideSquareCount[3] = genBottom(vertices, data);
    sideSquareCount[4] = genLeft(vertices, data);
    sideSquareCount[5] = genRight(vertices, data);
    data.seeThrough = true;

    sideSquareCount[6] = genFront(vertices, data);
    sideSquareCount[7] = genBack(vertices, data);
    sideSquareCount[8] = genTop(vertices, data);
    sideSquareCount[9] = genBottom(vertices, data);
    sideSquareCount[10] = genLeft(vertices, data);
    sideSquareCount[11] = genRight(vertices, data);

    const vertArr = new Uint8Array(vertices);
    profiler.add('meshgenComplex', start, performance.now());
    return [vertArr, sideSquareCount];
};
