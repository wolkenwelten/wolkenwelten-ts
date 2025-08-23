/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * # World
 * Central state container of the voxel game engine
 *
 * TL;DR 📜
 *   • Exactly one `World` exists per `Game` instance.
 *   • All coordinates are ABSOLUTE block units (Y-up, positive Y = sky).
 *   • 32 × 32 × 32 blocks form a *chunk*; chunks are addressed via
 *     `coordinateToWorldKey()` which packs the chunk-space x/y/z into a
 *     single 48-bit integer (16 bits per axis).
 *
 * Responsibilities 💼
 *   • Maintain a sparse `Map` of `Chunk` instances (`chunks`).
 *   • Track live `Entity` instances and drive their `update()` loop.
 *   • Coordinate block access, delegating writes to the network on the
 *     client and to the in-memory chunk data on the server.
 *   • Run procedural terrain generation through `worldgenHandler`.
 *   • Keep the simulation footprint small via `gc()` and `DangerZone`.
 *
 * Extending 🚀
 *   The `World` class is designed for composition: inject additional domain
 *   services that reference `world` rather than subclassing.  Only subclass
 *   when absolutely necessary and **always** call `super.*` for lifecycle
 *   methods (`constructor`, `update`, …) or subtle desync bugs will occur.
 *
 * Footguns & Gotchas ⚠️
 *   • `worldgenHandler` **must** be assigned before the first call that may
 *     trigger chunk generation (`worldgen()`, `getOrGenChunk()`, etc.).
 *   • `coordinateToWorldKey()` masks each axis to 16 bits; coordinates that
 *     exceed ±32 768 blocks will alias and corrupt the chunk map.
 *   • On the *client* `setBlock()` merely dispatches a network message; it
 *     does **not** mutate the local chunk immediately.  Tests without a
 *     mocked network therefore appear to "do nothing".
 *   • `gc()` drops chunks/entities by comparing *squared block distance* to
 *     `renderDistance² × 4`.  When tweaking render distance remember the
 *     quadratic relationship!
 *   • `bottomOfTheWorld` is POSITIVE (900) and represents the kill plane –
 *     do not confuse it with y = 0.
 *
 */
import type { Game } from "../game";
import { Entity } from "./entity";
import type { WorldGen } from "./worldGen";
import type { ClientGame } from "../client/clientGame";
import profiler from "../profiler";
import { BlockType } from "./blockType";
import { Chunk } from "./chunk/chunk";
import { DangerZone } from "./chunk/dangerZone";
import { isClient } from "../util/compat";
import { NetworkObject } from "./entity/networkObject";

import { Bomb } from "./entity/bomb";

/**
 * Convert absolute block coordinates to a 48-bit key that uniquely identifies
 * the containing 32³-block chunk.
 *
 * Bit layout (low → high): `[x15‥0] [y15‥0] [z15‥0]`.
 *
 * NOTE: Each axis is masked to 16 bits – exceeding ±32 768 blocks causes key
 * collisions and undefined behaviour.
 */
export const coordinateToWorldKey = (x: number, y: number, z: number) =>
	((Math.floor(x) >> 5) & 0xffff) +
	((Math.floor(y) >> 5) & 0xffff) * 0x10000 +
	((Math.floor(z) >> 5) & 0xffff) * 0x100000000;

export const worldKeyToCoordinate = (key: number) => {
	const x = (key & 0xffff) << 5;
	const y = ((key >> 16) & 0xffff) << 5;
	const z = ((key >> 32) & 0xffff) << 5;
	return { x, y, z };
};

export class World {
	chunks: Map<number, Chunk> = new Map();
	dangerZone: DangerZone;
	entities: Map<number, Entity> = new Map();
	networkObjects: Map<number, NetworkObject> = new Map();
	seed: number;
	game: Game;
	blocks: BlockType[] = [];
	blockTextureUrl = "";
	worldgenHandler?: WorldGen;
	bottomOfTheWorld = 900;

	constructor(game: Game) {
		this.seed = 1234;
		this.game = game;
		this.dangerZone = new DangerZone(this);
	}

	/**
	 * Server-side one-time pre-generation step. Calls
	 * `worldgenHandler.preGen()` allowing heavy global calculations (e.g.
	 * biome maps) to be cached before chunks stream in.
	 */
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

	/**
	 * Change a block at absolute world coordinates.
	 *
	 * Client side: Sends a network message → no immediate local mutation.
	 * Server side: Lazily loads the corresponding chunk and writes directly.
	 */
	setBlock(x: number, y: number, z: number, block: number) {
		if (this.game.isClient) {
			(this.game as ClientGame).network.blockUpdate(x, y, z, block);
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

	/**
	 * Fetch the chunk that contains (`x`,`y`,`z`) or generate it on demand.
	 *
	 * WARNING: This involves a Map lookup and may trigger procedural
	 * generation; avoid calling it repeatedly for many adjacent blocks – cache
	 * the chunk reference instead.
	 */
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

		if (isClient()) {
			(this.game as ClientGame).network.chunkRequest(cx, cy, cz);
		} else {
			if (!this.worldgenHandler) {
				throw new Error("Missing WorldGen");
			}
			const start = performance.now();
			this.worldgenHandler.genChunk(newChunk);
			profiler.add("worldgen", start, performance.now());
			newChunk.loaded = true;
		}

		this.chunks.set(key, newChunk);
		return newChunk;
	}

	update() {
		for (const entity of this.entities.values()) {
			entity.update();
			if (entity.destroyed) {
				this.removeEntity(entity);
			}
		}
		if ((this.game.ticks & 0xf) === 0) {
			this.dangerZone.update();
		}
		NetworkObject.staticUpdate(this);
	}

	deserializeNetworkObject(data: any) {
		const oldObj = this.networkObjects.get(data.id);
		if (oldObj) {
			oldObj.deserialize(data);
			return oldObj;
		} else {
			return NetworkObject.deserialize(this, data);
		}
	}

	addEntity(entity: Entity) {
		this.entities.set(entity.id, entity);
	}

	addNetworkObject(networkObject: NetworkObject) {
		this.networkObjects.set(networkObject.id, networkObject);
	}

	removeEntity(entity: Entity) {
		this.entities.delete(entity.id);
	}

	removeNetworkObject(networkObject: NetworkObject) {
		this.networkObjects.delete(networkObject.id);
	}

	getNetworkObjectsByType(
		T: string,
		includeDestroyed = false,
	): NetworkObject[] {
		const ret = [];
		for (const obj of this.networkObjects.values()) {
			if (obj.T === T && (includeDestroyed || !obj.destroyed)) {
				ret.push(obj);
			}
		}
		return ret;
	}

	/**
	 * Garbage-collect far-away chunks & entities to keep memory usage bounded.
	 * Criteria: squared block distance compared to
	 * `renderDistance² × 4` (roughly twice the visible horizon).
	 */
	gc() {
		if (!this.game.player) {
			return;
		}
		const maxDistance =
			(this.game.render?.renderDistance || 0) *
			(this.game.render?.renderDistance || 0) *
			4;
		for (const chunk of this.chunks.values()) {
			if (!this.worldgenHandler?.mayGC(chunk)) {
				continue;
			}
			if (chunk.gc(maxDistance, this.game.player)) {
				const key = coordinateToWorldKey(chunk.x, chunk.y, chunk.z);
				this.chunks.delete(key);

				this.game.render?.dropBlockMesh(chunk.x, chunk.y, chunk.z);
				if (this.game.isClient) {
					(this.game as ClientGame).network.chunkDrop(
						chunk.x,
						chunk.y,
						chunk.z,
					);
				}
			}
		}
		const px = this.game.player.x;
		const py = this.game.player.y;
		const pz = this.game.player.z;
		for (const e of this.entities.values()) {
			const dx = px - e.x;
			const dy = py - e.y;
			const dz = pz - e.z;
			const dd = dx * dx + dy * dy + dz * dz;
			if (dd > maxDistance) {
				e.destroy();
			}
		}
	}

	/**
	 * Mark the chunk containing (`x`,`y`,`z`) *and* its 6 face neighbours as
	 * invalid so their lighting/meshes will be rebuilt on next access.
	 */
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

	/**
	 * Fill a solid sphere of blocks.
	 *
	 * Centre: (`cx`, `cy`, `cz`) – absolute block coordinates.
	 * Radius: `radius` – blocks (inclusive, Euclidean distance).
	 * Block  : `block` – numeric block id.
	 *
	 * Client side: issues one network message per affected block.
	 * Server side: writes directly to chunks, triggering re-meshing as needed.
	 */
	setSphere(cx: number, cy: number, cz: number, radius: number, block: number) {
		const r2 = radius * radius;
		const x0 = Math.floor(cx - radius);
		const y0 = Math.floor(cy - radius);
		const z0 = Math.floor(cz - radius);
		const x1 = Math.floor(cx + radius);
		const y1 = Math.floor(cy + radius);
		const z1 = Math.floor(cz + radius);

		for (let x = x0; x <= x1; x++) {
			for (let y = y0; y <= y1; y++) {
				for (let z = z0; z <= z1; z++) {
					const dx = x - cx;
					const dy = y - cy;
					const dz = z - cz;
					if (dx * dx + dy * dy + dz * dz <= r2) {
						this.setBlock(x, y, z, block);
					}
				}
			}
		}
	}
}
