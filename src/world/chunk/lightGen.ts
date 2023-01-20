
const light = new Uint8Array(32 * 32);

const sunlight = (out: Uint8Array, blocks: Uint8Array) => {
    for (let i = 0; i < 32 * 32; i++) {
        light[i] = 15;
    }
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

const lightBlurX = (out: Uint8Array) => {
    for (let y = 0; y < 32; y++) {
        for (let z = 0; z < 32; z++) {
            let a = 0;
            let b = 0;
            for (let x = 0; x < 32; x++) {
                const aOff = x * 32 * 32 + y * 32 + z;
                a = Math.max(a, out[aOff]);
                out[aOff] = a;
                a = Math.max(0, a - 1);

                const bx = 31 - x;
                const bOff = bx * 32 * 32 + y * 32 + z;
                b = Math.max(b, out[bOff]);
                out[bOff] = b;
                b = Math.max(0, b - 1);
            }
        }
    }
};

const lightBlurY = (out: Uint8Array) => {
    for (let x = 0; x < 32; x++) {
        for (let z = 0; z < 32; z++) {
            let a = 0;
            let b = 0;
            for (let y = 0; y < 32; y++) {
                const aOff = x * 32 * 32 + y * 32 + z;
                a = Math.max(a, out[aOff]);
                out[aOff] = a;
                a = Math.max(0, a - 1);

                const by = 31 - y;
                const bOff = x * 32 * 32 + by * 32 + z;
                b = Math.max(b, out[bOff]);
                out[bOff] = b;
                b = Math.max(0, b - 1);
            }
        }
    }
};

const lightBlurZ = (out: Uint8Array) => {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            let a = 0;
            let b = 0;
            for (let z = 0; z < 32; z++) {
                const aOff = x * 32 * 32 + y * 32 + z;
                a = Math.max(a, out[aOff]);
                out[aOff] = a;
                a = Math.max(0, a - 1);

                const bz = 31 - z;
                const bOff = x * 32 * 32 + y * 32 + bz;
                b = Math.max(b, out[bOff]);
                out[bOff] = b;
                b = Math.max(0, b - 1);
            }
        }
    }
};

const lightBlur = (out: Uint8Array) => {
    lightBlurX(out);
    lightBlurY(out);
    lightBlurZ(out);
};

const ambientOcclusion = (out: Uint8Array, blocks: Uint8Array) => {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                const off = x * 32 * 32 + y * 32 + z;
                if (blocks[off] !== 0) {
                    out[off] = out[off] >> 2;
                }
            }
        }
    }
};

export const lightGenSimple = (out: Uint8Array, blocks: Uint8Array) => {
    sunlight(out, blocks);
    lightBlur(out);
    ambientOcclusion(out, blocks);
};
