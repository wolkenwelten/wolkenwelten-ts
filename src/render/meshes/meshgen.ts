/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * This file prepares all the chunk data so that the meshing function itself can be pure.
 * Because of this we should be able to put it into a separate worker.
 */
import type { Chunk } from '../../world/chunk/chunk';
import profiler from '../../profiler';
import { clamp } from '../../util/math';
import { BlockType } from '../../world/blockType';
import { lightGenSimple } from '../../world/chunk/lightGen';
import { meshgenReal } from './meshgenWorker';

const createIdentityBlocks = () => {
    const ret: BlockType[] = [];
    ret.push(new BlockType(0, 'Void').withInvisible());
    for (let i = 1; i < 256; i++) {
        ret.push(new BlockType(i, '').withTexture(i - 1));
    }
    return ret;
};

const tmpSimpleLight = new Uint8Array(32 * 32 * 32);
const identityBlocks = createIdentityBlocks();

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

export const meshgenVoxelMesh = (voxels: Uint8Array): [Uint8Array, number] => {
    const start = performance.now();
    const blockData = new Uint8Array(34 * 34 * 34);
    const lightData = new Uint8Array(34 * 34 * 34);
    lightData.fill(15);
    lightGenSimple(tmpSimpleLight, voxels);
    blitChunkData(blockData, voxels, 1, 1, 1);
    blitChunkData(lightData, tmpSimpleLight, 1, 1, 1);

    const blocks = identityBlocks;
    const msg = {
        blockData,
        lightData,
        blocks,
        lightFinished: true,
    };
    const ret = meshgenReal(msg);
    let vertCount = 0;
    for (let i = 0; i < ret[1].length; i++) {
        vertCount += ret[1][i];
    }
    profiler.add('meshgenSimple', start, performance.now());
    return [ret[0], vertCount];
};

export const meshgenChunk = (chunk: Chunk): [Uint8Array, number[]] => {
    const start = performance.now();
    const blockData = new Uint8Array(34 * 34 * 34);
    const lightData = new Uint8Array(34 * 34 * 34);

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
    const blocks = chunk.world.blocks;
    const msg = {
        blockData,
        lightData,
        blocks,
        lightFinished: false,
    };
    const ret = meshgenReal(msg);
    profiler.add('meshgenComplex', start, performance.now());
    return ret;
};
