/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
const reservedSpace: u32 = 2 ** 28 - 2 ** 24;
const chunkSize: u32 = 32 ** 3;
const chunkMax: u32 = reservedSpace / chunkSize;
const freeMap: Uint32Array = new Uint32Array(chunkMax);
let freeMapLast: u32 = 0;

export { simpleLight } from './lightGen';

export function init(): void {
    for (let i: u32 = 1; i < chunkMax; i++) {
        freeMap[i - 1] = i * chunkSize;
    }
    freeMapLast = chunkMax - 1;
}

export function malloc(): u32 {
    if (freeMapLast == 0) {
        console.error('We ran out of memory!!!');
        return 0;
    }
    const ret = freeMap[--freeMapLast];
    memory.fill(ret, 0, chunkSize);
    return ret;
}

export function free(ptr: u32): void {
    if (ptr & 0x3fff || ptr > reservedSpace) {
        console.error("Doesn't seem like a pointer we allocated");
        return;
    }
    freeMap[freeMapLast++] = ptr;
}

export function chunksFree(): u32 {
    return freeMapLast;
}

export function chunksInUse(): u32 {
    return chunkMax - 1 - chunksFree();
}
