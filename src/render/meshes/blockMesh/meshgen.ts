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

    out.push(x + w, y + h, zd, tex, side | ((light >> 4) & 0xf0));
    out.push(x, y + h, zd, tex, side | ((light >> 8) & 0xf0));
    out.push(x, y, zd, tex, side | ((light << 4) & 0xf0));
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

    out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
    out.push(x + w, y + h, z, tex, side | ((light >> 4) & 0xf0));
    out.push(x + w, y, z, tex, side | (light & 0xf0));

    out.push(x + w, y + h, z, tex, side | ((light >> 4) & 0xf0));
    out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
    out.push(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
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

    out.push(x + w, yh, z + d, tex, side | ((light >> 4) & 0xf0));
    out.push(x + w, yh, z, tex, side | ((light >> 8) & 0xf0));
    out.push(x, yh, z, tex, side | ((light << 4) & 0xf0));
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

    out.push(x + w, y, z + d, tex, side | ((light >> 4) & 0xf0));
    out.push(x, y, z + d, tex, side | ((light >> 8) & 0xf0));
    out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
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

    out.push(x, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
    out.push(x, y + h, z, tex, side | ((light >> 8) & 0xf0));
    out.push(x, y, z, tex, side | ((light << 4) & 0xf0));
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

    out.push(xw, y + h, z + d, tex, side | ((light >> 4) & 0xf0));
    out.push(xw, y, z + d, tex, side | ((light >> 8) & 0xf0));
    out.push(xw, y, z, tex, side | ((light << 4) & 0xf0));
};

const needsFront = (chunk: Chunk, x: number, y: number, z: number): boolean => {
    if (z >= 31) {
        return true;
    }
    const b = chunk.getBlock(x, y, z + 1);
    return b === 0;
};

const needsBack = (chunk: Chunk, x: number, y: number, z: number): boolean => {
    if (z <= 0) {
        return true;
    }
    const b = chunk.getBlock(x, y, z - 1);
    return b === 0;
};

const needsTop = (chunk: Chunk, x: number, y: number, z: number): boolean => {
    if (y >= 31) {
        return true;
    }
    const b = chunk.getBlock(x, y + 1, z);
    return b === 0;
};

const needsBottom = (
    chunk: Chunk,
    x: number,
    y: number,
    z: number
): boolean => {
    if (y <= 0) {
        return true;
    }
    const b = chunk.getBlock(x, y - 1, z);
    return b === 0;
};

const needsRight = (chunk: Chunk, x: number, y: number, z: number): boolean => {
    if (x >= 31) {
        return true;
    }
    const b = chunk.getBlock(x + 1, y, z);
    return b === 0;
};

const needsLeft = (chunk: Chunk, x: number, y: number, z: number): boolean => {
    if (x <= 0) {
        return true;
    }
    const b = chunk.getBlock(x - 1, y, z);
    return b === 0;
};

export const meshgen = (chunk: Chunk): Uint8Array => {
    const light = 0xffff;
    const ret: number[] = [];

    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                const b = chunk.getBlock(x, y, z);
                if (b) {
                    const bt = blocks[b];
                    if (!bt) {
                        throw new Error(`Unknown block type: ${b}`);
                    }
                    if (needsFront(chunk, x, y, z)) {
                        addFront(ret, x, y, z, 1, 1, 1, bt.texFront, light);
                    }
                    if (needsBack(chunk, x, y, z)) {
                        addBack(ret, x, y, z, 1, 1, 1, bt.texBack, light);
                    }
                    if (needsTop(chunk, x, y, z)) {
                        addTop(ret, x, y, z, 1, 1, 1, bt.texTop, light);
                    }
                    if (needsBottom(chunk, x, y, z)) {
                        addBottom(ret, x, y, z, 1, 1, 1, bt.texBottom, light);
                    }
                    if (needsLeft(chunk, x, y, z)) {
                        addLeft(ret, x, y, z, 1, 1, 1, bt.texLeft, light);
                    }
                    if (needsRight(chunk, x, y, z)) {
                        addRight(ret, x, y, z, 1, 1, 1, bt.texRight, light);
                    }
                }
            }
        }
    }

    return new Uint8Array(ret);
};
