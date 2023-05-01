/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import profiler from '../../profiler';
import * as wasm from '../../wasm';

/* Calculate a simple lightmap, this is a lightmap that is comletely self contained
 * to a chunk, meaning light sources from neighboring chunks will be ignored.
 * We can blur multiple simple lightmaps together to create a complex lightmap that
 * is used for lighting the world.
 */
export const lightGenSimple = (lightPtr: number, blockPtr: number) => {
    const start = performance.now();
    wasm.simpleLight(lightPtr, blockPtr);
    profiler.add('lightGenSimple', start, performance.now());
};
