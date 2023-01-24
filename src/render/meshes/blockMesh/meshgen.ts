import { Chunk } from '../../../world/chunk';
import { blocks } from '../../../world/blockType';
import { glMatrix } from 'gl-matrix';

const blockData = new Uint8Array(34 * 34 * 34);
const lightData = new Uint8Array(34 * 34 * 34);
const sideCache = new Uint8Array(32 * 32 * 32);

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
                const chunkOff = cz * 32 * 32 + cy * 32 + cx; // Transposing the X and Z axes shouldn't be necessary
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
    lightData: Uint8Array;
    sideCache: Uint8Array;
}

class PlaneEntry {
    width = new Uint8Array(32 * 32);
    height = new Uint8Array(32 * 32);
    block = new Uint8Array(32 * 32);
    light = new Uint16Array(32 * 32);

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
                        this.light[aOff] == this.light[bOff] &&
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
    const { sideCache, blockData, lightData } = args;
    // First we slice the chunk into many, zero-initialized, planes
    for (let z = 0; z < 32; z++) {
        let found = 0;
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const off = y * 32 + x;
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 1) === 0) {
                    plane.block[off] = 0;
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
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
    return (vertices.length - start) / 4 / 5;
};

const genBack = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { sideCache, blockData, lightData } = args;
    for (let z = 0; z < 32; z++) {
        let found = 0;
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const off = y * 32 + x;
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 2) === 0) {
                    plane.block[off] = 0;
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
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
    return (vertices.length - start) / 4 / 5;
};

const genTop = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { sideCache, blockData, lightData } = args;
    for (let y = 0; y < 32; y++) {
        let found = 0;
        for (let z = 0; z < 32; z++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const off = z * 32 + x;
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 4) === 0) {
                    plane.block[off] = 0;
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
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
    return (vertices.length - start) / 4 / 5;
};

const genBottom = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { sideCache, blockData, lightData } = args;
    for (let y = 0; y < 32; y++) {
        let found = 0;
        for (let z = 0; z < 32; z++) {
            for (let x = 0; x < 32; x++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const off = z * 32 + x;
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 8) === 0) {
                    plane.block[off] = 0;
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
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
    return (vertices.length - start) / 4 / 5;
};

const genRight = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { sideCache, blockData, lightData } = args;
    for (let x = 0; x < 32; x++) {
        let found = 0;
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const off = y * 32 + z;
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 16) === 0) {
                    plane.block[off] = 0;
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
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
    return (vertices.length - start) / 4 / 5;
};

const genLeft = (vertices: number[], args: GenArgs) => {
    const start = vertices.length;
    const { sideCache, blockData, lightData } = args;
    for (let x = 0; x < 32; x++) {
        let found = 0;
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                // Skip all faces that can't be seen, due to a block
                // being right in front of that particular face.
                const off = y * 32 + z;
                if ((sideCache[x * 32 * 32 + y * 32 + z] & 32) === 0) {
                    plane.block[off] = 0;
                    continue;
                }
                // Gotta increment our counter so that we don't skip this chunk
                found += 1;
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
    return (vertices.length - start) / 4 / 5;
};

const lightBlurX = (out: Uint8Array) => {
    for (let y = 0; y < 34; y++) {
        for (let z = 0; z < 34; z++) {
            let a = 0;
            let b = 0;
            for (let x = 0; x < 34; x++) {
                const aOff = x * 34 * 34 + y * 34 + z;
                a = Math.max(a, out[aOff]);
                out[aOff] = a;
                a = Math.max(0, a - 1);

                const bx = 31 - x;
                const bOff = bx * 34 * 34 + y * 34 + z;
                b = Math.max(b, out[bOff]);
                out[bOff] = b;
                b = Math.max(0, b - 1);
            }
        }
    }
};

const lightBlurY = (out: Uint8Array) => {
    for (let x = 0; x < 34; x++) {
        for (let z = 0; z < 34; z++) {
            let a = 0;
            let b = 0;
            for (let y = 0; y < 34; y++) {
                const aOff = x * 34 * 34 + y * 34 + z;
                a = Math.max(a, out[aOff]);
                out[aOff] = a;
                a = Math.max(0, a - 1);

                const by = 31 - y;
                const bOff = x * 34 * 34 + by * 34 + z;
                b = Math.max(b, out[bOff]);
                out[bOff] = b;
                b = Math.max(0, b - 1);
            }
        }
    }
};

const lightBlurZ = (out: Uint8Array) => {
    for (let x = 0; x < 34; x++) {
        for (let y = 0; y < 34; y++) {
            let a = 0;
            let b = 0;
            for (let z = 0; z < 34; z++) {
                const aOff = x * 34 * 34 + y * 34 + z;
                a = Math.max(a, out[aOff]);
                out[aOff] = a;
                a = Math.max(0, a - 1);

                const bz = 31 - z;
                const bOff = x * 34 * 34 + y * 34 + bz;
                b = Math.max(b, out[bOff]);
                out[bOff] = b;
                b = Math.max(0, b - 1);
            }
        }
    }
};

const ambientOcclusion = (out: Uint8Array, blocks: Uint8Array) => {
    const end = 34*34*34 + 34*34 + 34;
    for(let off=0;off<end;off++){
        // Here we divide the light value by 2 when the position is occupied by a block
        // Written this way so it's branchless and easier to optimize/vectorize
        out[off] = out[off] >> (+(blocks[off] !== 0));
    }
};

const finishLight = (light: Uint8Array, block: Uint8Array) => {
    lightBlurX(light);
    lightBlurY(light);
    lightBlurZ(light);
    ambientOcclusion(light, block);
};

export const meshgenSimple = (chunk: Chunk): [Uint8Array, number[]] => {
    chunk.updateSimpleLight();
    const vertices: number[] = [];

    blitChunkData(blockData, chunk.blocks, 1, 1, 1);
    blitChunkData(lightData, chunk.simpleLight, 1, 1, 1);
    calcSideCache(sideCache, blockData);

    const sideSquareCount = [0, 0, 0, 0, 0, 0];
    const data = { blockData, lightData, sideCache, blockTypes: blocks };

    sideSquareCount[0] = genFront(vertices, data);
    sideSquareCount[1] = genBack(vertices, data);
    sideSquareCount[2] = genTop(vertices, data);
    sideSquareCount[3] = genBottom(vertices, data);
    sideSquareCount[4] = genLeft(vertices, data);
    sideSquareCount[5] = genRight(vertices, data);

    return [new Uint8Array(vertices), sideSquareCount];
};

export const meshgenComplex = (chunk: Chunk): [Uint8Array, number[]] => {
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
    calcSideCache(sideCache, blockData);
    finishLight(lightData, blockData);

    const sideSquareCount = [0, 0, 0, 0, 0, 0];
    const data = { blockData, lightData, sideCache, blockTypes: blocks };

    sideSquareCount[0] = genFront(vertices, data);
    sideSquareCount[1] = genBack(vertices, data);
    sideSquareCount[2] = genTop(vertices, data);
    sideSquareCount[3] = genBottom(vertices, data);
    sideSquareCount[4] = genLeft(vertices, data);
    sideSquareCount[5] = genRight(vertices, data);
    return [new Uint8Array(vertices), sideSquareCount];
};
