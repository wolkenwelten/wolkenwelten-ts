import { Chunk } from '../chunk';
import { LCG } from '../../util/prng';

export const worldgenSky = (chunk: Chunk) => {
    const rng = new LCG([chunk.x, chunk.y, chunk.z, chunk.world.seed]);
    if(rng.bool(15)){
        chunk.setSphere(16, 16, 16, 8, 2);
        chunk.setSphere(16, 15, 16, 8, 1);
        chunk.setSphere(16, 12, 16, 7, 3);
    }
};