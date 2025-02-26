/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../game";
import type { Entity } from "./entity/entity";
import type { WorldGen } from "./worldGen";
import profiler from "../profiler";
import { FireSystem } from "./fireSystem";
import { BlockType } from "./blockType";
import { Chunk } from "./chunk/chunk";
import { DangerZone } from "./chunk/dangerZone";
import { isClient } from "../util/compat";

export const coordinateToWorldKey = (x: number, y: number, z: number) =>
	((Math.floor(x) >> 5) & 0xffff) +
	((Math.floor(y) >> 5) & 0xffff) * 0x10000 +
	((Math.floor(z) >> 5) & 0xffff) * 0x100000000;

export class World {
	chunks: Map<number, Chunk> = new Map();
	fire: FireSystem;
	dangerZone: DangerZone;
	entities: Set<Entity> = new Set();
	seed: number;
	game: Game;
	blocks: BlockType[] = [];
	blockTextureUrl = "";
	worldgenHandler?: WorldGen;
	bottomOfTheWorld = 900;

	constructor(game: Game) {
		this.seed = 1234;
		this.game = game;
		this.fire = new FireSystem(this);
		this.dangerZone = new DangerZone(this);
	}

	worldgen() {
		if (!this.worldgenHandler) {
			throw new Error("Missing WorldGen");
		}
		const start = performance.now();
		if (!isClient()) {
			this.worldgenHandler.preGen(this);
			profiler.add("worldgenPreGen", start, performance.now());
		}
	}

	addBlockType(longName: string, name?: string): BlockType {
		const id = this.blocks.length;
		const ret = new BlockType(id, longName, name);
		this.blocks[id] = ret;
		this.game.blocks[name || longName] = id;
		return ret;
	}

	setBlock(x: number, y: number, z: number, block: number) {
		if (this.game.client) {
			this.game.client.network.blockUpdate(x, y, z, block);
		} else {
			this.getOrGenChunk(x, y, z).setBlock(x, y, z, block);
		}
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
		const cx = x & ~0x1f;
		const cy = y & ~0x1f;
		const cz = z & ~0x1f;
		const newChunk = new Chunk(this, cx, cy, cz);

		if (!isClient()) {
			if (!this.worldgenHandler) {
				throw new Error("Missing WorldGen");
			}
			const start = performance.now();
			this.worldgenHandler.genChunk(newChunk);
			profiler.add("worldgen", start, performance.now());
		}

		this.chunks.set(key, newChunk);
		return newChunk;
	}

	update() {
		for (const entity of this.entities) {
			entity.update();
			if (entity.destroyed) {
				this.removeEntity(entity);
			}
		}
		if ((this.game.ticks & 0xf) === 0) {
			this.dangerZone.update();
		}
		this.fire.update();
	}

	addEntity(entity: Entity) {
		this.entities.add(entity);
	}

	removeEntity(entity: Entity) {
		this.entities.delete(entity);
	}

	gc() {
		const maxDistance =
			this.game.render.renderDistance * this.game.render.renderDistance * 4;
		for (const chunk of this.chunks.values()) {
			if (!this.worldgenHandler?.mayGC(chunk)) {
				continue;
			}
			if (chunk.gc(maxDistance, this.game.player)) {
				const key = coordinateToWorldKey(chunk.x, chunk.y, chunk.z);
				this.chunks.delete(key);

				this.game.render.dropBlockMesh(chunk.x, chunk.y, chunk.z);
				this.game.client?.network.chunkDrop(chunk.x, chunk.y, chunk.z);
			}
		}
		const px = this.game.player.x;
		const py = this.game.player.y;
		const pz = this.game.player.z;
		for (const e of this.entities) {
			const dx = px - e.x;
			const dy = py - e.y;
			const dz = pz - e.z;
			const dd = dx * dx + dy * dy + dz * dz;
			if (dd > maxDistance) {
				e.destroy();
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
