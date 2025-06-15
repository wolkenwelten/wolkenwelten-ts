/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * # WorldGen 🌍
 *
 * Abstract base class for ALL procedural world-generation back-ends. A
 * single subclass instance is attached to the `World` and queried whenever
 * chunks need to be filled with blocks or global world information is
 * required.
 *
 * ## Typical lifecycle
 * 1. `new ConcreteWorldGen(seed)`
 * 2. `await init()`   (async heavy lifting / asset downloads)
 * 3. `preGen(world)`  (server-side global preprocessing)
 * 4. For each chunk: `genChunk(chunk)`
 *
 * ## Extension guidelines ⚙️
 * * Keep all RNG deterministic by ONLY using the provided `seed` plus the
 *   chunk coordinates. Networked clients rely on byte-perfect equality!
 * * Heavy, world-wide computations (biome maps, nav-meshes, etc.) belong
 *   into `preGen()` so they run once per world.
 * * NEVER perform blocking IO inside `genChunk()`; that method is called
 *   in the game loop and must stay short.
 * * Implement a sensible `mayGC()` strategy or the server will happily
 *   keep the whole planet in memory 🤯.
 *
 * ## Footguns & Gotchas ⚠️
 * * `spawnPos()` must return a coordinate that is NOT SOLID; the engine
 *   will not double-check and your player may suffocate.
 * * `genChunk()` runs on the server ONLY. The client receives already
 *   filled chunks over the wire.
 * * If you cache data keyed by chunk coordinates, remember that each axis
 *   is 32-block-aligned (bitshift >> 5) just like in `coordinateToWorldKey`.
 *
 * Have fun shaping new worlds! (≧▽≦)ゞ
 */
import type { Chunk } from "./chunk/chunk";
import type { Character } from "./entity";
import type { World } from "./world";

export abstract class WorldGen {
	public readonly seed: string;

	constructor(seed: string) {
		this.seed = seed;
	}

	/**
	 * Optional asynchronous bootstrap. Override when you need to load textures,
	 * noise-tables, etc. The engine awaits this method before entering the game
	 * loop.
	 */
	async init() {}

	/**
	 * Return a safe spawn position for `player`.
	 *
	 * Requirements: The chosen (x,y,z) must be inside loaded terrain *and* the
	 * two blocks above it must be non-solid (headroom). Preferrably near the
	 * world origin so new players find each other easily.
	 */
	abstract spawnPos(player: Character): [number, number, number];

	/**
	 * Called ONCE after the `World` instance is created but before any chunks
	 * are generated.  Perfect place for global preprocessing or caching.
	 */
	abstract preGen(world: World): void;

	/**
	 * Fill the 32³-block `chunk` with terrain, structures and metadata.
	 *
	 * Runs on the server thread. Avoid expensive calculations; prefer lookups
	 * into data prepared in `preGen()`.
	 */
	abstract genChunk(chunk: Chunk): void;

	/**
	 * Decide whether the engine may garbage-collect `chunk` when it drifts far
	 * away from the player.
	 *
	 * Return `true` to allow GC, `false` to keep the chunk resident (e.g. spawn
	 * area, critical dungeons, …).
	 */
	abstract mayGC(chunk: Chunk): boolean;
}
