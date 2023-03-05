/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { LCG } from '../../util/prng';
import { Chunk } from '../../world/chunk/chunk';

export const worldgenSky = (chunk: Chunk) => {
    const rng = new LCG([chunk.x, chunk.y, chunk.z, chunk.world.seed]);
    if (rng.bool(15)) {
        chunk.setSphere(16, 16, 16, 8, 2);
        chunk.setSphere(16, 15, 16, 8, 1);
        chunk.setSphere(16, 12, 16, 7, 3);
    }
};
