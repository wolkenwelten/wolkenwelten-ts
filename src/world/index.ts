import { Chunk } from './chunk';
export { Chunk } from "./chunk";

export const coordinateToWorldKey = (x: number, y: number, z: number) =>
    ((x >> 5) & 0xffff) +
    ((y >> 5) & 0xffff) * 0x10000 +
    ((z >> 5) & 0xffff) * 0x100000000;

export class World {
    chunks: Map<number, Chunk> = new Map();

    getChunk(x: number, y: number, z: number): Chunk | undefined {
        const chunk = this.chunks.get(coordinateToWorldKey(x, y, z));
        if (chunk) {
            if (chunk.x !== x || chunk.y !== y || chunk.z !== z) {
                throw new Error(
                    'coordinateToWorldKey got something wrong: [${x},${y},${z}] !== [${chunk.x},${chunk.y},${chunk.z}]'
                );
            }
        }
        return chunk;
    }

    getOrGenChunk(x: number, y: number, z: number): Chunk {
        const key = coordinateToWorldKey(x, y, z);
        const chunk = this.chunks.get(key);
        if (chunk) { return chunk; }
        const newChunk = new Chunk(x, y, z);
        this.chunks.set(key, newChunk);
        return newChunk;
    }

    setChunk(x: number, y: number, z: number, chunk: Chunk) {
        this.chunks.set(coordinateToWorldKey(x, y, z), chunk);
    }
}
