/* Copyright 2024 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Chunk } from "./chunk/chunk";
import type { Character } from "./entity/character";
import type { World } from "./world";

export abstract class WorldGen {
	public readonly seed: string;

	constructor(seed: string) {
		this.seed = seed;
	}

	async init() {}

	// Should return a valid spawn position for a player
	abstract spawnPos(player: Character): [number, number, number];
	// Called when the world is first created, before any chunks are generated
	// Here we could generate the entire world beforehand if it simplifies things.
	abstract preGen(world: World): void;
	// Called when a chunk needs to be generated
	abstract genChunk(chunk: Chunk): void;
	// Determines whether a chunk may be garbage collected
	abstract mayGC(chunk: Chunk): boolean;
}
