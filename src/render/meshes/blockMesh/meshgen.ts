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

const addFaceFront = (
    vertices: number[],
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    texture_index: number,
    light: number
) => {
    const side = 0; // sides.front
    const zd = z + d;

    vertices.push(x, y, zd, texture_index, side | ((light << 4) & 0xf0));
    vertices.push(x + w, y, zd, texture_index, side | (light & 0xf0));
    vertices.push(
        x + w,
        y + h,
        zd,
        texture_index,
        side | ((light >> 4) & 0xf0)
    );

    vertices.push(
        x + w,
        y + h,
        zd,
        texture_index,
        side | ((light >> 4) & 0xf0)
    );
    vertices.push(x, y + h, zd, texture_index, side | ((light >> 8) & 0xf0));
    vertices.push(x, y, zd, texture_index, side | ((light << 4) & 0xf0));
};

const addFaceBack = (
    vertices: number[],
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    texture_index: number,
    light: number
) => {
    const side = 1; // sides.front

    vertices.push(x, y, z, texture_index, side | ((light << 4) & 0xf0));
    vertices.push(x + w, y + h, z, texture_index, side | ((light >> 4) & 0xf0));
    vertices.push(x + w, y, z, texture_index, side | (light & 0xf0));

    vertices.push(x + w, y + h, z, texture_index, side | ((light >> 4) & 0xf0));
    vertices.push(x, y, z, texture_index, side | ((light << 4) & 0xf0));
    vertices.push(x, y + h, z, texture_index, side | ((light >> 8) & 0xf0));
};

const addFaceTop = (
    vertices: number[],
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    texture_index: number,
    light: number
) => {
    const side = 2;
    const yh = y + h;

    vertices.push(x, yh, z, texture_index, side | ((light << 4) & 0xf0));
    vertices.push(x, yh, z + d, texture_index, side | (light & 0xf0));
    vertices.push(
        x + w,
        yh,
        z + d,
        texture_index,
        side | ((light >> 4) & 0xf0)
    );

    vertices.push(
        x + w,
        yh,
        z + d,
        texture_index,
        side | ((light >> 4) & 0xf0)
    );
    vertices.push(x + w, yh, z, texture_index, side | ((light >> 8) & 0xf0));
    vertices.push(x, yh, z, texture_index, side | ((light << 4) & 0xf0));
};

const addFaceBottom = (
    vertices: number[],
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    texture_index: number,
    light: number
) => {
    const side = 3;

    vertices.push(x, y, z, texture_index, side | ((light << 4) & 0xf0));
    vertices.push(x + w, y, z, texture_index, side | (light & 0xf0));
    vertices.push(x + w, y, z + d, texture_index, side | ((light >> 4) & 0xf0));

    vertices.push(x + w, y, z + d, texture_index, side | ((light >> 4) & 0xf0));
    vertices.push(x, y, z + d, texture_index, side | ((light >> 8) & 0xf0));
    vertices.push(x, y, z, texture_index, side | ((light << 4) & 0xf0));
};

const addFaceLeft = (
    vertices: number[],
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    texture_index: number,
    light: number
) => {
    const side = 4;

    vertices.push(x, y, z, texture_index, side | ((light << 4) & 0xf0));
    vertices.push(x, y, z + d, texture_index, side | (light & 0xf0));
    vertices.push(x, y + h, z + d, texture_index, side | ((light >> 4) & 0xf0));

    vertices.push(x, y + h, z + d, texture_index, side | ((light >> 4) & 0xf0));
    vertices.push(x, y + h, z, texture_index, side | ((light >> 8) & 0xf0));
    vertices.push(x, y, z, texture_index, side | ((light << 4) & 0xf0));
};

const addFaceRight = (
    vertices: number[],
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    texture_index: number,
    light: number
) => {
    const side = 5;
    const xw = x + w;

    vertices.push(xw, y, z, texture_index, side | ((light << 4) & 0xf0));
    vertices.push(xw, y + h, z, texture_index, side | (light & 0xf0));
    vertices.push(
        xw,
        y + h,
        z + d,
        texture_index,
        side | ((light >> 4) & 0xf0)
    );

    vertices.push(
        xw,
        y + h,
        z + d,
        texture_index,
        side | ((light >> 4) & 0xf0)
    );
    vertices.push(xw, y, z + d, texture_index, side | ((light >> 8) & 0xf0));
    vertices.push(xw, y, z, texture_index, side | ((light << 4) & 0xf0));
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
                    addFaceFront(ret, x, y, z, 1, 1, 1, bt.texFront, light);
                    addFaceBack(ret, x, y, z, 1, 1, 1, bt.texBack, light);
                    addFaceTop(ret, x, y, z, 1, 1, 1, bt.texTop, light);
                    addFaceBottom(ret, x, y, z, 1, 1, 1, bt.texBottom, light);
                    addFaceLeft(ret, x, y, z, 1, 1, 1, bt.texLeft, light);
                    addFaceRight(ret, x, y, z, 1, 1, 1, bt.texRight, light);
                }
            }
        }
    }

    return new Uint8Array(ret);
};
