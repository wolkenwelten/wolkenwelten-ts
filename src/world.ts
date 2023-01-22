import { Game } from './game';
import { Entity } from './world/entity';
import { Chunk } from './world/chunk';

export const coordinateToWorldKey = (x: number, y: number, z: number) =>
    ((x >> 5) & 0xffff) +
    ((y >> 5) & 0xffff) * 0x10000 +
    ((z >> 5) & 0xffff) * 0x100000000;

export class World {
    chunks: Map<number, Chunk> = new Map();
    entities: Set<Entity> = new Set();
    game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    setBlock(x: number, y: number, z: number, block: number) {
        const chunk = this.getOrGenChunk(
            Math.floor(x) & ~0x1f,
            Math.floor(y) & ~0x1f,
            Math.floor(z) & ~0x1f
        );
        chunk.setBlock(
            Math.floor(x) & 0x1f,
            Math.floor(y) & 0x1f,
            Math.floor(z) & 0x1f,
            block
        );
    }

    getBlock(x: number, y: number, z: number): number | undefined {
        const chunk = this.getChunk(
            Math.floor(x) & ~0x1f,
            Math.floor(y) & ~0x1f,
            Math.floor(z) & ~0x1f
        );
        return chunk
            ? chunk.getBlock(
                  Math.floor(x) & 0x1f,
                  Math.floor(y) & 0x1f,
                  Math.floor(z) & 0x1f
              )
            : undefined;
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

    isLoaded(x: number, y: number, z: number): boolean {
        const chunk = this.getChunk(
            Math.floor(x) & ~0x1f,
            Math.floor(y) & ~0x1f,
            Math.floor(z) & ~0x1f
        );
        return Boolean(chunk);
    }

    isSolid(x: number, y: number, z: number): boolean {
        return Boolean(this.getBlock(x, y, z));
    }

    getOrGenChunk(x: number, y: number, z: number): Chunk {
        const key = coordinateToWorldKey(x, y, z);
        const chunk = this.chunks.get(key);
        if (chunk) {
            return chunk;
        }
        const newChunk = new Chunk(this, x, y, z);
        this.chunks.set(key, newChunk);
        return newChunk;
    }

    setChunk(x: number, y: number, z: number, chunk: Chunk) {
        this.chunks.set(coordinateToWorldKey(x, y, z), chunk);
    }

    update() {
        for (const entity of this.entities) {
            entity.update();
        }
    }

    addEntity(entity: Entity) {
        this.entities.add(entity);
    }

    removeEntity(entity: Entity) {
        this.entities.delete(entity);
    }

    gc() {
        const maxDistance =
            this.game.render.renderDistance *
            this.game.render.renderDistance *
            4;
        for (const chunk of this.chunks.values()) {
            if (chunk.gc(maxDistance, this.game.player)) {
                const key = coordinateToWorldKey(chunk.x, chunk.y, chunk.z);
                this.chunks.delete(key);
                this.game.render.world.meshes.delete(key);
            }
        }
    }
}
