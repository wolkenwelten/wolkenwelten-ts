/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../game';
import { DangerZone } from './dangerZone';
import { Entity } from './entity/entity';
import { Chunk } from './chunk/chunk';
import { BlockType } from './blockType/blockType';
import { MiningManager } from './mining';
import { WorldgenAssetManager } from './worldgen/assets';
import { initDefaultBlocks } from './blockType/blockTypeDefaults';

export const coordinateToWorldKey = (x: number, y: number, z: number) =>
    ((Math.floor(x) >> 5) & 0xffff) +
    ((Math.floor(y) >> 5) & 0xffff) * 0x10000 +
    ((Math.floor(z) >> 5) & 0xffff) * 0x100000000;

export class World {
    chunks: Map<number, Chunk> = new Map();
    dangerZone: DangerZone;
    entities: Set<Entity> = new Set();
    seed: number;
    mining: MiningManager;
    game: Game;
    assets: WorldgenAssetManager;
    blocks: BlockType[] = [];
    blockTextureUrl = '';

    constructor(game: Game) {
        this.seed = 1234;
        this.game = game;
        this.mining = new MiningManager(this);
        this.assets = new WorldgenAssetManager();
        this.dangerZone = new DangerZone(this);
        initDefaultBlocks(this);
    }

    addBlockType = (longName: string, name?: string): BlockType => {
        const id = this.blocks.length;
        const ret = new BlockType(id, longName, name);
        this.blocks[id] = ret;
        this.game.blocks[name || longName] = id;
        return ret;
    };

    setBlock(x: number, y: number, z: number, block: number) {
        this.getOrGenChunk(x, y, z)?.setBlock(x, y, z, block);
    }

    getBlock(x: number, y: number, z: number): number | undefined {
        return this.getChunk(x, y, z)?.getBlock(x, y, z);
    }

    getChunk(x: number, y: number, z: number): Chunk | undefined {
        return this.chunks.get(coordinateToWorldKey(x, y, z));
    }

    isLoaded(x: number, y: number, z: number): boolean {
        return Boolean(this.getChunk(x, y, z));
    }

    isSolid(x: number, y: number, z: number): boolean {
        const b = this.getBlock(x, y, z);
        if (!b) {
            return false;
        }
        const bt = this.blocks[b];
        return !bt.liquid;
    }

    isLiquid(x: number, y: number, z: number): boolean {
        const b = this.getBlock(x, y, z);
        if (!b) {
            return false;
        }
        const bt = this.blocks[b];
        return bt.liquid;
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
            if (entity.isDead) {
                this.removeEntity(entity);
            }
        }
        this.mining.update();
        this.dangerZone.update();
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
            8;
        for (const chunk of this.chunks.values()) {
            if (chunk.gc(maxDistance, this.game.player)) {
                const key = coordinateToWorldKey(chunk.x, chunk.y, chunk.z);
                this.chunks.delete(key);
                this.game.render.dropBlockMesh(chunk.x, chunk.y, chunk.z);
            }
        }
    }

    invalidatePosition(x: number, y: number, z: number) {
        this.getChunk(x, y, z)?.invalidate();
        const ox = ((x & 0x10) << 1) + (x & ~0x1f) - 32;
        const oy = ((y & 0x10) << 1) + (y & ~0x1f) - 32;
        const oz = ((z & 0x10) << 1) + (z & ~0x1f) - 32;
        for (let ix = 0; ix < 2; ix++) {
            for (let iy = 0; iy < 2; iy++) {
                for (let iz = 0; iz < 2; iz++) {
                    const cx = ox + ix * 32;
                    const cy = oy + iy * 32;
                    const cz = oz + iz * 32;
                    this.getChunk(cx, cy, cz)?.invalidate();
                }
            }
        }
    }
}
