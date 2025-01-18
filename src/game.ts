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
import { PersistenceManager } from "./persistence";
import { ProfilingManager } from "./profiler";
import { RenderManager } from "./render/render";
import { UIManager } from "./ui/ui";
import { Character } from "./world/entity/character";
import { StaticObject } from "./world/chunk/staticObject";
import { Mob } from "./world/entity/mob";
import { Item } from "./world/item/item";
import { World } from "./world/world";
import { NetworkManager } from "./network";
import { FloatingIslandsWorldGen } from "./content/floatingIslandsWorldGen";

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
	config: GameConfig;
	input: InputManager;
	persistence: PersistenceManager;
	network: NetworkManager;
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
		this.network = new NetworkManager();
		this.benchmark = new BenchmarkManager(this);
		this.world = new World(this);
		this.player = new Character(this.world);
		this.persistence = new PersistenceManager(this);
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
		/*
        this.player.respawn();
        this.player.noClip = true;
        this.player.x = 4050;
        this.player.z = 3975;
        this.player.y = 990;
        */
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
