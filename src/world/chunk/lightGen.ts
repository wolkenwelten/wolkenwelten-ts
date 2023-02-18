/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import profiler from '../../profiler';
const light = new Uint8Array(32 * 32);

/* Here we try to approximate sunlight by going top to bottom
 * and setting the lightness value to one stored in an accumulator
 * per pillar. As soon as we hit a block we set the accumulator to 0
 * otherwise we increment it by 1 and max out at 15.
 *
 * While this leads to light just appearing out of nowhere in big caves
 * it has the advantage that we don't need to know about all the blocks
 * above, since there could be ~4 billion blocks above.
 */
const sunlight = (out: Uint8Array, blocks: Uint8Array) => {
    light.fill(15);
    for (let y = 31; y >= 0; y--) {
        for (let x = 0; x < 32; x++) {
            for (let z = 0; z < 32; z++) {
                const off = x * 32 * 32 + y * 32 + z;
                const l =
                    blocks[off] === 0 ? Math.min(15, light[x * 32 + z] + 1) : 0;
                out[off] = light[x * 32 + z] = l;
            }
        }
    }
};

/* A 3D Blur function that blurs across 3 axes back and forth in a
 * a single loop, mostly unreadable but much faster than a readable
 * version bluring each axis one by one
 */
const lightBlur = (out: Uint8Array) => {
    for (let x = 0; x < 32; x++) {
        for (let z = 0; z < 32; z++) {
            let a = 0;
            let b = 0;

            let c = 0;
            let d = 0;

            let e = 0;
            let f = 0;

            for (let y = 0; y < 32; y++) {
                const back = 31 - y;

                const aOff = y * 32 * 32 + x * 32 + z;
                out[aOff] = a = Math.max(a - 1, out[aOff]);

                const bOff = back * 32 * 32 + x * 32 + z;
                out[bOff] = b = Math.max(b - 1, out[bOff]);

                const cOff = x * 32 * 32 + y * 32 + z;
                out[cOff] = c = Math.max(c - 1, out[cOff]);

                const dOff = x * 32 * 32 + back * 32 + z;
                out[dOff] = d = Math.max(d - 1, out[dOff]);

                const eOff = x * 32 * 32 + z * 32 + y;
                out[eOff] = e = Math.max(e - 1, out[eOff]);

                const fOff = x * 32 * 32 + z * 32 + back;
                out[fOff] = f = Math.max(f - 1, out[fOff]);
            }
        }
    }
};

/* Calculate a simple lightmap, this is a lightmap that is comletely self contained
 * to a chunk, meaning light sources from neighboring chunks will be ignored.
 * We can blur multiple simple lightmaps together to create a complex lightmap that
 * is used for lighting the world.
 */
export const lightGenSimple = (out: Uint8Array, blocks: Uint8Array) => {
    const start = performance.now();
    sunlight(out, blocks);
    lightBlur(out);
    profiler.add('lightGenSimple', start, performance.now());
};
