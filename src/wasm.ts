/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import * as wasm from '../build/main';
export {
    init,
    malloc,
    free,
    chunksFree,
    chunksInUse,
    simpleLight,
} from '../build/main';

export const u8 = new Uint8Array(wasm.memory.buffer);
