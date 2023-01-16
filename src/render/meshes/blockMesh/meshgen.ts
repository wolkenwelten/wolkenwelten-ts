import { Chunk } from '../../../world/chunk';
import { blocks } from '../../../world/blockType';

const sides = {
    front: 0,
    back: 1,
    top: 2,
    bottom: 3,
    left: 4,
    right: 5,
};

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

    out.push(x, y, zd, tex, side | ((light << 4) & 0xf0));
    out.push(x + w, y, zd, tex, side | (light & 0xf0));
    out.push(x + w, y + h, zd, tex, side | ((light >> 4) & 0xf0));
    out.push(x, y + h, zd, tex, side | ((light >> 8) & 0xf0));
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

    out.push(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
    out.push(x + w, y + h, z, tex, side | ((light >> 4) & 0xf0));
    out.push(x + w, y, z, tex, side | (light & 0xf0));
    out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
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

    out.push(x, yh, z, tex, side | ((light << 4) & 0xf0));
    out.push(x, yh, z + d, tex, side | (light & 0xf0));
    out.push(x + w, yh, z + d, tex, side | ((light >> 4) & 0xf0));
    out.push(x + w, yh, z, tex, side | ((light >> 8) & 0xf0));
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

    out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
    out.push(x + w, y, z, tex, side | (light & 0xf0));
    out.push(x + w, y, z + d, tex, side | ((light >> 4) & 0xf0));
    out.push(x, y, z + d, tex, side | ((light >> 8) & 0xf0));
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

    out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
    out.push(x, y, z + d, tex, side | (light & 0xf0));
    out.push(x, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
    out.push(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
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

    out.push(xw, y, z, tex, side | ((light << 4) & 0xf0));
    out.push(xw, y + h, z, tex, side | (light & 0xf0));
    out.push(xw, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
    out.push(xw, y, z + d, tex, side | ((light >> 8) & 0xf0));
};

const clamp = (num: number, min: number, max: number) =>
    Math.min(Math.max(num, min), max);
const blitChunkDataEnd = (off: number): [number, number] => [
    clamp(off, 0, 34),
    clamp(off + 32, 0, 34),
];
const blockBufferPosToOffset = (x: number, y: number, z: number): number =>
    x * 34 * 34 + y * 34 + z;

const blitChunkData = (
    blockData: Uint8Array,
    chunkData: Uint8Array,
    offX: number,
    offY: number,
    offZ: number
) => {
    const [xStart, xEnd] = blitChunkDataEnd(offX);
    const [yStart, yEnd] = blitChunkDataEnd(offY);
    const [zStart, zEnd] = blitChunkDataEnd(offZ);
    for (let x = xStart; x < xEnd; x++) {
        const cx = x - offX;
        for (let y = yStart; y < yEnd; y++) {
            const cy = y - offY;
            for (let z = zStart; z < zEnd; z++) {
                const cz = z - offZ;
                const blockOff = blockBufferPosToOffset(x, y, z);
                const chunkOff = cx * 32 * 32 + cy * 32 + cz;
                blockData[blockOff] = chunkData[chunkOff];
            }
        }
    }
};

const calcSides = (
    x: number,
    y: number,
    z: number,
    blockData: Uint8Array
): number => {
    const off = blockBufferPosToOffset(x, y, z);
    if (blockData[off] === 0) {
        return 0;
    }
    return (
        +(blockData[off + 1] == 0) |
        (+(blockData[off - 1] == 0) << 1) |
        (+(blockData[off + 34] == 0) << 2) |
        (+(blockData[off - 34] == 0) << 3) |
        (+(blockData[off + 34 * 34] == 0) << 4) |
        (+(blockData[off - 34 * 34] == 0) << 5)
    );
};

const calcSideCache = (sideCache: Uint8Array, blockData: Uint8Array) => {
    let off = 0;
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                sideCache[off++] = calcSides(x + 1, y + 1, z + 1, blockData);
            }
        }
    }
};

interface GenArgs {
    blockData: Uint8Array;
    sideCache: Uint8Array;
}

class PlaneEntry {
    width = new Uint8Array(32 * 32);
    height = new Uint8Array(32 * 32);
    block = new Uint8Array(32 * 32);

    optimize() {
        for (let y = 31; y >= 0; y--) {
            for (let x = 31; x >= 0; x--) {
                if (this.block[x * 32 + y] === 0) {
                    continue;
                }
                if (x < 30) {
                    const aOff = x * 32 + y;
                    const bOff = aOff + 32;
                    if (
                        this.block[aOff] == this.block[bOff] &&
                        this.width[aOff] == this.width[bOff]
                    ) {
                        this.height[aOff] += this.height[bOff];
                        this.block[bOff] = 0;
                    }
                }
                if (y < 30) {
                    const aOff = x * 32 + y;
                    const bOff = aOff + 1;
                    if (
                        this.block[aOff] == this.block[bOff] &&
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

const genFront = (vertices: number[], args: GenArgs): number => {
    const start = vertices.length;
    const { sideCache, blockData } = args;
    // First we slice the chunk into many, zero-initialized, planes
    for (let z = 0; z < 32; z++) {
        let found = 0;
        let plane = new PlaneEntry();
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.

                if ((sideCache[x * 32 * 32 + y * 32 + z] & 1) === 0) {
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
                plane.width[y * 32 + x] = 1;
                plane.height[y * 32 + x] = 1;
                plane.block[y * 32 + x] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                /*
                plane.light[y][x] = lightFrontBack(light_data, x, y, z + 2)
                    | (lightFrontBack(light_data, x + 1, y, z + 2) << 4)
                    | (lightFrontBack(light_data, x + 1, y + 1, z + 2) << 8)
                    | (lightFrontBack(light_data, x, y + 1, z + 2) << 12);
                */
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
                if (plane.block[y * 32 + x] === 0) {
                    continue;
                }
                const light = 0xffff;
                const cw = plane.width[y * 32 + x];
                const ch = plane.height[y * 32 + x];
                const b = blocks[plane.block[y * 32 + x]];
                addFront(vertices, x, y, z, cw, ch, cd, b.texFront, light);
            }
        }
    }
    return (vertices.length - start) / 4;
};

const genBack = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { sideCache, blockData } = args;
    for (let z = 0; z < 32; z++) {
        let found = 0;
        let plane = new PlaneEntry();
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 2) === 0) {
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
                plane.width[y * 32 + x] = 1;
                plane.height[y * 32 + x] = 1;
                plane.block[y * 32 + x] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                /*
                plane.light[y][x] = light_front_back(light_data, x, y, z)
                    | (light_front_back(light_data, x, y + 1, z) << 4)
                    | (light_front_back(light_data, x + 1, y + 1, z) << 8)
                    | (light_front_back(light_data, x + 1, y, z) << 12);
                */
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
                if (plane.block[y * 32 + x] === 0) {
                    continue;
                }
                let cw = plane.width[y * 32 + x];
                let ch = plane.height[y * 32 + x];
                let light = 0xffff;
                let b = blocks[plane.block[y * 32 + x]];
                addBack(vertices, x, y, z, cw, ch, cd, b.texBack, light);
            }
        }
    }
    return (vertices.length - start) / 4;
};

const genTop = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { sideCache, blockData } = args;
    for (let y = 0; y < 32; y++) {
        let found = 0;
        let plane = new PlaneEntry();
        for (let z = 0; z < 32; z++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 4) === 0) {
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
                plane.width[z * 32 + x] = 1;
                plane.height[z * 32 + x] = 1;
                plane.block[z * 32 + x] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                /*
                plane.light[z][x] = light_top_bottom(light_data, x, y + 2, z)
                    | (light_top_bottom(light_data, x, y + 2, z + 1) << 4)
                    | (light_top_bottom(light_data, x + 1, y + 2, z + 1) << 8)
                    | (light_top_bottom(light_data, x + 1, y + 2, z) << 12);
                */
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
                if (plane.block[z * 32 + x] === 0) {
                    continue;
                }
                const cw = plane.width[z * 32 + x];
                const cd = plane.height[z * 32 + x];
                //const light = plane.light[z][x];
                const light = 0xffff;
                const b = blocks[plane.block[z * 32 + x]];
                addTop(vertices, x, y, z, cw, ch, cd, b.texTop, light);
            }
        }
    }
    return (vertices.length - start) / 4;
};

const genBottom = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { sideCache, blockData } = args;
    for (let y = 0; y < 32; y++) {
        let found = 0;
        let plane = new PlaneEntry();
        for (let z = 0; z < 32; z++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 8) === 0) {
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
                plane.width[z * 32 + x] = 1;
                plane.height[z * 32 + x] = 1;
                plane.block[z * 32 + x] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                /*
                plane.light[z][x] = light_top_bottom(light_data, x, y, z)
                    | (light_top_bottom(light_data, x + 1, y, z) << 4)
                    | (light_top_bottom(light_data, x + 1, y, z + 1) << 8)
                    | (light_top_bottom(light_data, x, y, z + 1) << 12);
                */
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
                if (plane.block[z * 32 + x] === 0) {
                    continue;
                }
                const cw = plane.width[z * 32 + x];
                const cd = plane.height[z * 32 + x];
                //let light = plane.light[z*32+x];
                const light = 0xffff;
                const b = blocks[plane.block[z * 32 + x]];
                addBottom(vertices, x, y, z, cw, ch, cd, b.texBottom, light);
            }
        }
    }
    return (vertices.length - start) / 4;
};

const genRight = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { sideCache, blockData } = args;
    for (let x = 0; x < 32; x++) {
        let found = 0;
        let plane = new PlaneEntry();
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 16) === 0) {
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
                plane.width[y * 32 + z] = 1;
                plane.height[y * 32 + z] = 1;
                plane.block[y * 32 + z] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                /*
                plane.light[y][z] = light_left_right(light_data, x, y, z)
                    | (light_left_right(light_data, x, y, z + 1) << 4)
                    | (light_left_right(light_data, x, y + 1, z + 1) << 8)
                    | (light_left_right(light_data, x, y + 1, z) << 12);
                */
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
                if (plane.block[y * 32 + z] === 0) {
                    continue;
                }
                const cd = plane.width[y * 32 + z];
                const ch = plane.height[y * 32 + z];
                //const light = plane.light[y][z];
                const light = 0xffff;
                const b = blocks[plane.block[y * 32 + z]];
                addRight(vertices, x, y, z, cw, ch, cd, b.texLeft, light);
            }
        }
    }
    return (vertices.length - start) / 4;
};

const genLeft = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { sideCache, blockData } = args;
    for (let x = 0; x < 32; x++) {
        let found = 0;
        let plane = new PlaneEntry();
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 32) === 0) {
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
                plane.width[y * 32 + z] = 1;
                plane.height[y * 32 + z] = 1;
                plane.block[y * 32 + z] =
                    blockData[blockBufferPosToOffset(x + 1, y + 1, z + 1)];
                /*
                plane.light[y*32+z] = light_left_right(light_data, x + 2, y, z)
                    | (light_left_right(light_data, x + 2, y + 1, z) << 4)
                    | (light_left_right(light_data, x + 2, y + 1, z + 1) << 8)
                    | (light_left_right(light_data, x + 2, y, z + 1) << 12);
                */
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
                if (plane.block[y * 32 + z] === 0) {
                    continue;
                }
                const cd = plane.width[y * 32 + z];
                const ch = plane.height[y * 32 + z];
                //const light = plane.light[y][z];
                const light = 0xffff;
                const b = blocks[plane.block[y * 32 + z]];
                addLeft(vertices, x, y, z, cw, ch, cd, b.texRight, light);
            }
        }
    }
    return (vertices.length - start) / 4;
};

export const meshgen = (chunk: Chunk): Uint8Array => {
    const vertices: number[] = [];
    const blockData = new Uint8Array(34 * 34 * 34);
    const sideCache = new Uint8Array(32 * 32 * 32);

    blitChunkData(blockData, chunk.blocks, 1, 1, 1);
    calcSideCache(sideCache, blockData);

    const sideOffsets = [0, 0, 0, 0, 0, 0];
    const data = { blockData, sideCache, blockTypes: blocks };

    sideOffsets[0] = genFront(vertices, data);
    sideOffsets[1] = genBack(vertices, data);
    sideOffsets[2] = genTop(vertices, data);
    sideOffsets[3] = genBottom(vertices, data);
    sideOffsets[4] = genLeft(vertices, data);
    sideOffsets[5] = genRight(vertices, data);

    return new Uint8Array(vertices);
};
