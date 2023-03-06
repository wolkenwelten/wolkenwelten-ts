/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { LCG } from '../../util/prng';
import type { Chunk } from '../../world/chunk/chunk';
import type { WorldgenAssetList } from './assets';
import { StaticObject } from '../../world/chunk/staticObject';
import { Mob } from '../../world/entity/mob';

export const worldgen = (assets: WorldgenAssetList, chunk: Chunk) => {
    if (chunk.y < -512) {
        chunk.setBox(0, 0, 0, 32, 32, 32, 3); // Just fill everything with stone for now
    } else if (chunk.y < 512) {
        worldgenSurface(assets, chunk);
    } else {
        worldgenSky(chunk);
    }
};

const worldgenSky = (chunk: Chunk) => {
    const rng = new LCG([chunk.x, chunk.y, chunk.z, chunk.world.seed]);
    if (rng.bool(15)) {
        chunk.setSphere(16, 16, 16, 8, 2);
        chunk.setSphere(16, 15, 16, 8, 1);
        chunk.setSphere(16, 12, 16, 7, 3);
    }
};

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

const floodChunk = (chunk: Chunk, maxY: number) => {
    const waterBlock = 24;
    if (chunk.y > maxY) {
        return;
    }
    for (let y = 0; y < 32; y++) {
        if (y + chunk.y > maxY) {
            break;
        }
        for (let x = 0; x < 32; x++) {
            for (let z = 0; z < 32; z++) {
                const b = chunk.getBlock(x, y, z);
                if (b === 0) {
                    chunk.setBlockUnsafe(x, y, z, waterBlock);
                }
            }
        }
    }
};

const worldgenSurface = (assets: WorldgenAssetList, chunk: Chunk) => {
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

                    if (gh > -3 && endY < 32 && rng.bool(740)) {
                        Mob.create('crab', chunk.world, cx, gh + 2, cz);
                    } else if (
                        gh > -3 &&
                        gh < 0 &&
                        endY < 32 &&
                        rng.bool(640)
                    ) {
                        StaticObject.create('shell', chunk, cx, gh + 1, cz);
                    } else if (
                        gh > -3 &&
                        gh < 0 &&
                        endY < 32 &&
                        rng.bool(1240)
                    ) {
                        StaticObject.create('stick', chunk, cx, gh + 1, cz);
                    }
                } else if (gh > 24) {
                    chunk.setBoxUnsafe(x, 0, z, 1, Math.min(endY, 32), 1, 3);
                } else {
                    chunk.setBoxUnsafe(x, 0, z, 1, Math.min(endY, 32), 1, 1);
                    if (endY < 32) {
                        chunk.setBlockUnsafe(x, Math.floor(endY), z, 2);
                        if (gh > 2 && gh < 23) {
                            if (
                                rng.bool(1725) &&
                                assets.bushA.fits(chunk, x, gh, z)
                            ) {
                                assets.bushA.blit(chunk, x, gh, z);
                            } else if (
                                rng.bool(1625) &&
                                assets.bushB.fits(chunk, x, gh, z)
                            ) {
                                assets.bushB.blit(chunk, x, gh, z);
                            } else if (
                                rng.bool(1525) &&
                                assets.bushC.fits(chunk, x, gh, z)
                            ) {
                                assets.bushC.blit(chunk, x, gh, z);
                            } else if (
                                rng.bool(1625) &&
                                assets.rockA.fits(chunk, x, gh, z)
                            ) {
                                assets.rockA.blit(chunk, x, gh, z);
                            } else if (
                                rng.bool(1925) &&
                                assets.rockB.fits(chunk, x, gh, z)
                            ) {
                                assets.rockB.blit(chunk, x, gh, z);
                            } else if (
                                rng.bool(1825) &&
                                assets.rockC.fits(chunk, x, gh, z)
                            ) {
                                assets.rockC.blit(chunk, x, gh, z);
                            } else if (
                                rng.bool(620) &&
                                assets.treeA.fits(chunk, x, gh - 2, z)
                            ) {
                                assets.treeA.blit(chunk, x, gh - 2, z);
                            } else if (
                                rng.bool(730) &&
                                assets.treeB.fits(chunk, x, gh - 2, z)
                            ) {
                                assets.treeB.blit(chunk, x, gh - 2, z);
                            } else if (
                                rng.bool(630) &&
                                assets.treeC.fits(chunk, x, gh - 2, z)
                            ) {
                                assets.treeC.blit(chunk, x, gh - 2, z);
                            } else if (
                                rng.bool(600) &&
                                assets.spruceA.fits(chunk, x, gh - 2, z)
                            ) {
                                assets.spruceA.blit(chunk, x, gh - 2, z);
                            } else if (rng.bool(400)) {
                                Mob.create('rat', chunk.world, cx, gh + 2, cz);
                            } else if (rng.bool(300)) {
                                StaticObject.create(
                                    'stone',
                                    chunk,
                                    cx,
                                    gh + 1,
                                    cz
                                );
                            } else if (rng.bool(300)) {
                                StaticObject.create(
                                    'stick',
                                    chunk,
                                    cx,
                                    gh + 1,
                                    cz
                                );
                            } else if (rng.bool(300)) {
                                StaticObject.create(
                                    'flower',
                                    chunk,
                                    cx,
                                    gh + 1,
                                    cz
                                );
                            } else if (rng.bool(300)) {
                                StaticObject.create(
                                    'grass',
                                    chunk,
                                    cx,
                                    gh + 1,
                                    cz
                                );
                            }
                        }
                    }
                }
            }
        }
    }
    floodChunk(chunk, -3);
};
