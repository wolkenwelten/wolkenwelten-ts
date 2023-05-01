/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
const light = new Uint8Array(32 * 32);
import { min, max } from './math';

/* Here we try to approximate sunlight by going top to bottom
 * and setting the lightness value to one stored in an accumulator
 * per pillar. As soon as we hit a block we set the accumulator to 0
 * otherwise we increment it by 1 and max out at 15.
 *
 * While this leads to light just appearing out of nowhere in big caves
 * it has the advantage that we don't need to know about all the blocks
 * above, since there could be ~4 billion blocks above.
 */
function sunlight(lightPtr: u32, blockPtr: u32): void {
    light.fill(15);
    for (let y: u32 = 31; ; y--) {
        for (let x: u32 = 0; x < 32; x++) {
            for (let z: u32 = 0; z < 32; z++) {
                const off: u32 = x * 32 * 32 + y * 32 + z;
                const block = unchecked(load<u8>(blockPtr + off));
                const l = block === 0 ? min(15, unchecked(light[x * 32 + z]) + 1) : 0;
                unchecked(light[x * 32 + z] = l);
                unchecked(store<u8>(lightPtr + off, l));
            }
        }
        if (y == 0) {
            break;
        }
    }
}

/* A 3D Blur function that blurs across 3 axes back and forth */
function lightBlur(lightPtr: u32): void {
    for (let y:u32 = 0; y < 32; y++) {
        for (let z:u32 = 0; z < 32; z++) {
            let a = 0;
            let b = 0;

            for (let x:u32 = 0; x < 32; x++) {
                const aOff:u32 = x * 32 * 32 + y * 32 + z;
                a = max(a, load<u8>(lightPtr + aOff));
                store<u8>(lightPtr + aOff, a);
                a = max(0, a - 1);

                const bx:u32 = 31 - x;
                const bOff:u32 = bx * 32 * 32 + y * 32 + z;
                b = max(b, load<u8>(lightPtr + bOff));
                store<u8>(lightPtr + bOff, b);
                b = max(0, b - 1);
            }
        }
    }

    for (let x:u32 = 0; x < 32; x++) {
        for (let z:u32 = 0; z < 32; z++) {
            let a = 0;
            let b = 0;
            for (let y:u32 = 0; y < 32; y++) {
                const aOff:u32 = x * 32 * 32 + y * 32 + z;
                a = max(a, load<u8>(lightPtr + aOff));
                store<u8>(lightPtr + aOff, a);
                a = max(0, a - 1);

                const by:u32 = 31 - y;
                const bOff:u32 = x * 32 * 32 + by * 32 + z;
                b = max(b, load<u8>(lightPtr + bOff));
                store<u8>(lightPtr + bOff, b);
                b = max(0, b - 1);
            }
        }
    }

    for (let x: u32 = 0; x < 32; x++) {
        for (let y: u32 = 0; y < 32; y++) {
            let a = 0;
            let b = 0;
            for (let z: u32 = 0; z < 32; z++) {
                const aOff: u32 = x * 32 * 32 + y * 32 + z;
                a = max(a, load<u8>(lightPtr + aOff));
                store<u8>(lightPtr + aOff, a);
                a = max(0, a - 1);

                const bz: u32 = 31 - z;
                const bOff: u32 = x * 32 * 32 + y * 32 + bz;
                b = max(b, load<u8>(lightPtr + bOff));
                store<u8>(lightPtr + bOff, b);
                b = max(0, b - 1);
            }
        }
    }
}

export function simpleLight(lightPtr: u32, blockPtr: u32): void {
    sunlight(lightPtr, blockPtr);
    lightBlur(lightPtr);
}
