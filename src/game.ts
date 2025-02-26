/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */

import { registerAudioContent } from "./content/audioContent";
import { registerBlockTypes } from "./content/blockTypes";
import { registerItems } from "./content/itemContent";
import { registerStaticObjects } from "./content/staticObjects";

import { AudioManager } from "./audio";
import { BenchmarkManager } from "./benchmark";
import { InputManager } from "./input";
import { Options } from "./options";
import { ProfilingManager } from "./profiler";
import { RenderManager } from "./render/render";
import { UIManager } from "./ui/ui";
import { Character } from "./world/entity/character";
import { StaticObject } from "./world/chunk/staticObject";
import { Mob } from "./world/entity/mob";
import { Item } from "./world/item/item";
import { World } from "./world/world";
import { FloatingIslandsWorldGen } from "./content/floatingIslandsWorldGen";
import type { ClientGame } from "./client/clientGame";

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

	audio: AudioManager;
	benchmark: BenchmarkManager;
	blocks: BlockTypeRegistry = {};
	client?: ClientGame;
	config: GameConfig;
	input: InputManager;
	player: Character;
	profiler: ProfilingManager;
	render: RenderManager;
	ui: UIManager;
	options: Options;
	world: World;

	ticks = 1;
	startTime = +Date.now();
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
		this.audio = new AudioManager();

		this.registerContent();

		this.ui = new UIManager(this);
		this.render = new RenderManager(this, this.player);
		this.input = new InputManager(this);

		setInterval(this.gc.bind(this), 20000);
		setTimeout(this.init.bind(this), 0);
	}

	registerContent() {
		registerAudioContent(this.audio);
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
		this.audio.update(this.player); // Update AudioEmitter positions in case Entities get destroyed
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
