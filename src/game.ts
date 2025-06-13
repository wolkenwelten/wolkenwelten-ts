/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 * ┃  Game – Abstract root of all game sessions (server *and* client)        ┃
 * ┃  "One loop to rule them all"  ⸜(｡˃ ᵕ ˂ )⸝💖                               ┃
 * ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
 * ┃ Purpose                                                                  ┃
 * ┃  • Encapsulates world state, timing and common managers that are shared  ┃
 * ┃    by both the browser-side `ClientGame` and Node-side `ServerGame`.      ┃
 * ┃  • Provides an *update-loop* that attempts to catch up with real time    ┃
 * ┃    (~60 Hz) without blocking for longer than ≈16 ticks.                  ┃
 * ┃  • Boots a fresh world via `World` + a specific `WorldGenHandler`.       ┃
 * ┃  • Houses global registries (currently only `blocks`) that are required  ┃
 * ┃    by content loading helpers.                                           ┃
 * ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
 * ┃ How to extend                                                            ┃
 * ┃ 1. Create a derived class (see `src/client/clientGame.ts` or             ┃
 * ┃    `src/server/serverGame.ts`).                                          ┃
 * ┃ 2. Call `super(config)` *first* in your constructor so that common       ┃
 * ┃    managers are initialised correctly.                                   ┃
 * ┃ 3. Overwrite / add managers as needed (audio, network, render …).        ┃
 * ┃ 4. When overriding `init()` or `update()` ALWAYS call `await super.init()`┃
 * ┃    / `super.update()` or you will desync ticks or miss world generation. ┃
 * ┃ 5. Set the convenience flags `this.isClient` / `this.isServer` in your   ┃
 * ┃    subclass – *they are only hints*, but several systems rely on them.   ┃
 * ┃ 6. If you schedule your own loops (for example the server does via       ┃
 * ┃    `setInterval`), remember to flip `this.running = true` or the base    ┃
 * ┃    class will silently early-return in `update()`.                       ┃
 * ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
 * ┃ Potential footguns 🧨                                                    ┃
 * ┃  • `ready` flag – `update()` & `gc()` NOP until worldgen finished.       ┃
 * ┃    Forgetting to await/observe `init()` leads to apparent freezes.       ┃
 * ┃  • `ticks` is mutated inside the tight loop; never rely on it to equal   ┃
 * ┃    *number of calls* to `update()`.                                      ┃
 * ┃  • Long-running synchronous work in `world.update()` can still block     ┃
 * ┃    the event loop because it is executed repeatedly until we caught      ┃
 * ┃    up with real time. Heavy AI or path-finding should be spread out.     ┃
 * ┃  • `registerContent()` is invoked from constructor; content code must    ┃
 * ┃    not rely on overriden fields that are set *after* `super()`.          ┃
 * ┃  • Garbage collection (`gc()`) is naïve – it runs on a separate          ┃
 * ┃    `setInterval` and touches world chunks directly; be mindful of race   ┃
 * ┃    conditions if you integrate workers or atlas rebuilds.               ┃
 * ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
 * ┃ Quick reference                                                          ┃
 * ┃  update() – step world until caught up with real-time.                   ┃
 * ┃  gc()      – thin wrapper that delegates to `world.gc()`.                ┃
 * ┃  millis()  – wall-clock milliseconds since game start.                  ┃
 * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
 */
import { registerBlockTypes } from "./content/blockTypes";

import { BenchmarkManager } from "./benchmark";
import { Options } from "./options";
import { ProfilingManager } from "./profiler";
import { Character } from "./world/entity/character";
import { World } from "./world/world";
import { FloatingIslandsWorldGen } from "./content/floatingIslandsWorldGen";
import type { RenderManager } from "./client/render/render";
import type { AudioManager } from "./client/audio";

export interface GameConfig {}

export interface BlockTypeRegistry {
	[key: string]: number;
}

export abstract class Game {
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

	networkID = 0;
	ticks = 1;
	ready = false;
	running = false;

	player?: Character;

	constructor(config: GameConfig) {
		this.config = config;
		this.options = new Options();
		this.profiler = ProfilingManager.profiler();
		this.benchmark = new BenchmarkManager(this);
		this.world = new World(this);

		this.registerContent();

		setInterval(this.gc.bind(this), 20000);
		setTimeout(this.init.bind(this), 0);
	}

	/**
	 * Register hard-coded content (block types, entities …) that is needed
	 * by *every* Game instance. Subclasses may extend this but should call
	 * `super.registerContent()` to keep the base registries intact.
	 */
	registerContent() {
		registerBlockTypes(this.world);
	}

	/**
	 * Bootstraps a fresh `World` including its procedural generator. The default
	 * implementation uses `FloatingIslandsWorldGen` as a placeholder. Override
	 * in your subclass if you want different terrain – but remember to set
	 * `this.ready = true` when you are done or the main loop will never start.
	 */
	async init() {
		const worldgenHandler = new FloatingIslandsWorldGen("asdqwe");
		await worldgenHandler.init();
		this.world.worldgenHandler = worldgenHandler;
		this.world.worldgen();
		this.ready = true;
	}

	/**
	 * Progress the simulation until it has (roughly) caught up with real time.
	 * Uses a while-loop instead of a fixed-delta call to minimise drift on low
	 * FPS machines. Will early-exit if `ready` is *false* or the game is not
	 * `running` (pausing is as easy as flipping that flag).
	 */
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

	/**
	 * Periodic clean-up helper that delegates to `world.gc()`. Runs via its own
	 * 20-second interval, therefore it is safe to call lightweight; heavy logic
	 * should still live in `World`.
	 */
	gc() {
		if (!this.ready) {
			return;
		}
		this.world.gc();
	}

	/**
	 * Handy wall-clock helper since `startTime` so that we do not have to import
	 * any external timing libs. Mostly used for tick scheduling.
	 */
	millis(): number {
		return +Date.now() - this.startTime;
	}
}
