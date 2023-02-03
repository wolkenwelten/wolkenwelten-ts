import { Chunk } from '../chunk/chunk';

export const worldgenUnderground = (chunk: Chunk) => {
    chunk.setBox(0, 0, 0, 32, 32, 32, 3); // Just fill everything with stone for now
};
