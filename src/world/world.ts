import { Game } from '../game';
import { Entity } from './entities/entity';
import { Chunk } from './chunk';
export { Chunk } from './chunk';

export const coordinateToWorldKey = (x: number, y: number, z: number) =>
    ((x >> 5) & 0xffff) +
    ((y >> 5) & 0xffff) * 0x10000 +
    ((z >> 5) & 0xffff) * 0x100000000;

export class World {
    chunks: Map<number, Chunk> = new Map();
    entities: Entity[] = [];
    game: Game;

    constructor (game: Game) {
        this.game = game;
    }

    getBlock(x: number, y: number, z: number): number | undefined {
        const chunk = this.getChunk(Math.floor(x) & ~0x1F, Math.floor(y) & ~0x1F, Math.floor(z) & ~0x1F);
        return chunk ? chunk.getBlock(Math.floor(x) & 0x1f, Math.floor(y) & 0x1f, Math.floor(z) & 0x1f) : undefined;
    }

    getChunk(x: number, y: number, z: number): Chunk | undefined {
        const chunk = this.chunks.get(coordinateToWorldKey(x, y, z));
        if (chunk) {
            if (chunk.x !== x || chunk.y !== y || chunk.z !== z) {
                throw new Error(
                    `coordinateToWorldKey got something wrong: [${x},${y},${z}] !== [${chunk.x},${chunk.y},${chunk.z}]`
                );
            }
        }
        return chunk;
    }

    getOrGenChunk(x: number, y: number, z: number): Chunk {
        const key = coordinateToWorldKey(x, y, z);
        const chunk = this.chunks.get(key);
        if (chunk) {
            return chunk;
        }
        const newChunk = new Chunk(this.game.ticks, x, y, z);
        this.chunks.set(key, newChunk);
        return newChunk;
    }

    setChunk(x: number, y: number, z: number, chunk: Chunk) {
        this.chunks.set(coordinateToWorldKey(x, y, z), chunk);
    }

    update() {
        for(const entity of this.entities) {
            entity.update(this);
        }
    }

    addEntity(entity: Entity) {
        this.entities.push(entity);
    }
}
