/* Copyright 2024 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Chunk } from "./chunk/chunk";

export abstract class WorldGen {
	public readonly seed: string;

	constructor(seed: string) {
		this.seed = seed;
	}

	// Will be called before the first chunk will be generated to allow for
	// loading external assets / pre-calculations
	async init() {}

	abstract genChunk(chunk: Chunk): void;
}
