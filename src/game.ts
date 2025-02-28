/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */

import { registerBlockTypes } from "./content/blockTypes";
import { registerItems } from "./content/itemContent";
import { registerStaticObjects } from "./content/staticObjects";

import { BenchmarkManager } from "./benchmark";
import { Options } from "./options";
import { ProfilingManager } from "./profiler";
import { Character } from "./world/entity/character";
import { StaticObject } from "./world/chunk/staticObject";
import { Mob } from "./world/entity/mob";
import { Item } from "./world/item/item";
import { World } from "./world/world";
import { FloatingIslandsWorldGen } from "./content/floatingIslandsWorldGen";
import type { RenderManager } from "./client/render/render";
import type { AudioManager } from "./client/audio";

export interface GameConfig {
	parent: HTMLElement;
}

export interface BlockTypeRegistry {
	[key: string]: number;
}

export class Game {
	Item: typeof Item;
	Mob: typeof Mob;
	StaticObject: typeof StaticObject;

	isClient = false;
	isServer = false;
	readonly startTime = +Date.now();

	readonly audio?: AudioManager;
	readonly render?: RenderManager;

	readonly benchmark: BenchmarkManager;
	readonly blocks: BlockTypeRegistry = {};
	readonly config: GameConfig;
	readonly profiler: ProfilingManager;

	readonly options: Options;
	readonly world: World;

	player: Character;
	ticks = 1;
	ready = false;
	running = false;

	constructor(config: GameConfig) {
		this.Item = Item;
		this.Mob = Mob;
		this.StaticObject = StaticObject;

		this.config = config;
		this.options = new Options();
		this.profiler = ProfilingManager.profiler();
		this.benchmark = new BenchmarkManager(this);
		this.world = new World(this);
		this.player = new Character(this.world);

		this.registerContent();

		setInterval(this.gc.bind(this), 20000);
		setTimeout(this.init.bind(this), 0);
	}

	registerContent() {
		registerItems();
		registerBlockTypes(this.world);
		registerStaticObjects();
	}

	async init() {
		const worldgenHandler = new FloatingIslandsWorldGen("asdqwe");
		await worldgenHandler.init();
		this.world.worldgenHandler = worldgenHandler;
		this.world.worldgen();
		this.ready = true;
	}

	// Run the game for a single tick
	update() {
		if (!this.ready || !this.running) {
			return;
		}
		let ticksRun = 0;
		const goalTicks = this.millis() / (1000 / 60);
		while (this.ticks < goalTicks) {
			this.ticks++;
			this.world.update();
			if (++ticksRun > 16) {
				this.ticks = goalTicks;
				break; // Don't block for too long
			}
		}
	}

	// Try and free some memory by discarding far away objects
	gc() {
		if (!this.ready) {
			return;
		}
		this.world.gc();
	}

	// Return the amount of milliseconds elapsed since the game started
	millis(): number {
		return +Date.now() - this.startTime;
	}
}
