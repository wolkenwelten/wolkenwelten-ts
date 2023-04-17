/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * This file prepares all the chunk data so that the meshing function itself can be pure.
 * Because of this we should be able to put it into a separate worker.
 */
import type { Chunk } from '../../world/chunk/chunk';
import type { GenMsg, RetMsg } from './meshgenWorker';
import profiler from '../../profiler';
import { clamp } from '../../util/math';
import { lightGenSimple } from '../../world/chunk/lightGen';
import { meshgenReal } from './meshgenWorker';

const tmpSimpleLight = new Uint8Array(32 * 32 * 32);

const workers:Worker[] = [];
const workerCount = navigator.hardwareConcurrency || 4;
let workerSpin = 0;
for(let i=0;i<workerCount;i++){
    workers[i] = new Worker(
        new URL('./meshgenWorker', import.meta.url),
        {type: 'module'}
    );
    workers[i].onmessage = (e:any) => {
        msgCallback(e.data);
    };
}

let msgCallback:((msg:RetMsg) => void) = () => {};
export const meshgenMsgCallback = (cb:(msg:RetMsg) => void) => {
    msgCallback = cb;
};

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

    const blockSeeThrough = new Uint8Array(256).fill(1);
    const textures = new Uint8Array(256);
    for(let i=1;i<256;i++){
        textures[i] = i-1;
    }
    const msg:GenMsg = {
        x: 0,
        y: 0,
        z: 0,
        ticks: 0,
        blockData,
        lightData,
        blockSeeThrough,
        blockTextures: [
            textures,
            textures,
            textures,
            textures,
            textures,
            textures,
        ],
        lightFinished: true,
    }
    const ret = meshgenReal(msg);
    let elementCount = 0;
    for(let i=0;i<ret.sideElementCount.length;i++){
        elementCount += ret.sideElementCount[i];
    }
    profiler.add('meshgenSimple', start, performance.now());
    return [ret.vertices, elementCount];
};

export const meshgenChunk = (chunk: Chunk) => {
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
    const l = blocks.length;
    const blockSeeThrough = new Uint8Array(l);
    const texFront = new Uint8Array(l);
    const texBack = new Uint8Array(l);
    const texTop = new Uint8Array(l);
    const texBottom = new Uint8Array(l);
    const texLeft = new Uint8Array(l);
    const texRight = new Uint8Array(l);
    for(let i=0;i<l;i++){
        const bt = blocks[i];
        blockSeeThrough[i] = bt.seeThrough ? 1 : 0;
        texFront[i] = bt.texFront;
        texBack[i] = bt.texBack;
        texTop[i] = bt.texTop;
        texBottom[i] = bt.texBottom;
        texLeft[i] = bt.texLeft;
        texRight[i] = bt.texRight;
    }
    const x = chunk.x;
    const y = chunk.y;
    const z = chunk.z;
    const ticks = chunk.world.game.ticks;

    const msg:GenMsg = {
        x,
        y,
        z,
        ticks,
        blockData,
        lightData,
        blockSeeThrough,
        blockTextures: [
            texFront,
            texBack,
            texTop,
            texBottom,
            texLeft,
            texRight,
        ],
        lightFinished: false,
    };
    const worker = workers[workerSpin++];
    if(workerSpin >= workerCount){
        workerSpin = 0;
    }
    worker.postMessage(msg);
    profiler.add('meshgenChunk', start, performance.now());
};