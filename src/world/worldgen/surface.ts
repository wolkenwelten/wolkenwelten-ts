import { Chunk } from '../chunk';
import { LCG } from '../../util/prng';

const grassHeight = (x: number, z: number): number => {
    const d = Math.sqrt(x * x + z * z);
    const deg = Math.atan2(x, z);

    const dmy = Math.sin(deg) * 768.0;

    let dy = Math.sin(deg * 35.0) * 16.0;
    dy = dy + Math.sin(deg * 48.0) * 8.0;

    let duy = Math.sin(deg * 61.0) * 4.0;
    duy = duy + Math.sin(deg * 78.0) * 3.0;
    duy = duy + Math.sin(deg * 98.0) * 2.0;

    let y =
        Math.min(900.0 - (d + dy + dmy), d + dy / 2.0 - (600.0 - 128.0 + duy)) /
        16.0;
    if (y > 24.0) {
        y = 24.0 + (y - 24.0) * 23.45;
    }
    return Math.max(-28, y);
};

const plantTree = (
    chunk: Chunk,
    x: number,
    gh: number,
    z: number,
    treeHeight: number
) => {
    chunk.setBoxUnsafe(
        x - 1,
        Math.floor(gh) + 5,
        z - 1,
        3,
        Math.min(treeHeight - 2, 32),
        3,
        6
    );
    chunk.setBoxUnsafe(
        x - 2,
        Math.floor(gh) + 5,
        z,
        5,
        Math.min(treeHeight - 4, 32),
        1,
        6
    );
    chunk.setBoxUnsafe(
        x,
        Math.floor(gh) + 5,
        z - 2,
        1,
        Math.min(treeHeight - 4, 32),
        5,
        6
    );
    chunk.setBlockUnsafe(x, Math.floor(gh) + treeHeight + 3, z, 6);
    chunk.setBlockUnsafe(x + 1, Math.floor(gh) + treeHeight + 2, z + 1, 0);
    chunk.setBlockUnsafe(x + 1, Math.floor(gh) + treeHeight + 2, z - 1, 0);
    chunk.setBlockUnsafe(x - 1, Math.floor(gh) + treeHeight + 2, z + 1, 0);
    chunk.setBlockUnsafe(x - 1, Math.floor(gh) + treeHeight + 2, z - 1, 0);

    chunk.setBlockUnsafe(x + 1, Math.floor(gh) + 4, z, 6);
    chunk.setBlockUnsafe(x - 1, Math.floor(gh) + 4, z, 6);
    chunk.setBlockUnsafe(x, Math.floor(gh) + 4, z + 1, 6);
    chunk.setBlockUnsafe(x, Math.floor(gh) + 4, z - 1, 6);

    chunk.setBoxUnsafe(x, Math.floor(gh - 1), z, 1, treeHeight, 1, 5);
};

const plantRock = (
    chunk: Chunk,
    x: number,
    gh: number,
    z: number,
    size: number
) => {
    chunk.setSphere(x, gh, z, size, 3);
};

export const worldgenSurface = (chunk: Chunk) => {
    const rng = new LCG([chunk.x, chunk.y, chunk.z, chunk.world.seed]);
    for (let x = 0; x < 32; x++) {
        for (let z = 0; z < 32; z++) {
            const cx = chunk.x + x;
            const cz = chunk.z + z;
            const gh = grassHeight(cx, cz);
            let endY = gh - chunk.y;
            if (endY >= 0) {
                if (gh < 1) {
                    chunk.setBoxUnsafe(x, 0, z, 1, Math.min(endY, 32), 1, 23);
                    if (gh < -6) {
                        if (rng.bool(31)) {
                            chunk.setBlockUnsafe(x, Math.floor(endY), z, 3);
                            if (rng.bool(31)) {
                                chunk.setBlockUnsafe(
                                    x,
                                    Math.floor(endY) + 1,
                                    z,
                                    3
                                );
                            }
                        }
                    }
                } else if (gh > 24) {
                    chunk.setBoxUnsafe(x, 0, z, 1, Math.min(endY, 32), 1, 3);
                } else {
                    chunk.setBoxUnsafe(x, 0, z, 1, Math.min(endY, 32), 1, 1);
                    if (endY < 32) {
                        chunk.setBlockUnsafe(x, Math.floor(endY), z, 2);
                        if (gh > 4 && gh < 23) {
                            if (
                                x > 3 &&
                                x < 29 &&
                                z > 3 &&
                                z < 29 &&
                                rng.bool(155)
                            ) {
                                const treeHeight = rng.int(8, 11);
                                plantTree(chunk, x, gh, z, treeHeight);
                            }
                            if (
                                x > 3 &&
                                x < 29 &&
                                z > 3 &&
                                z < 29 &&
                                rng.bool(392)
                            ) {
                                const size = rng.int(2, 4);
                                plantRock(chunk, x, gh, z, size);
                            }
                        }
                    }
                }
            }
        }
    }
};
