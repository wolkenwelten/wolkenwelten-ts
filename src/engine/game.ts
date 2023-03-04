/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { AudioManager } from './audio';
import { addDefaultAudios } from './audioDefaults';
import { InputManager } from './input';
import { Options } from './options';
import { PersistenceManager } from './persistence';
import { RenderManager } from './render/render';
import { UIManager } from './ui/ui';
import { ProfilingManager } from './util/profiler';
import { Character } from './world/character';
import { Item } from './world/item/item';
import { World } from './world/world';

export interface GameConfig {
    parent: HTMLElement;
}

export interface BlockTypeRegistry {
    [key: string]: number;
}

export class Game {
    audio: AudioManager;
    blocks: BlockTypeRegistry = {};
    config: GameConfig;
    input: InputManager;
    item: typeof Item;
    persistence: PersistenceManager;
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

    addContent() {}

    constructor(config: GameConfig) {
        this.config = config;
        this.options = new Options();
        this.profiler = ProfilingManager.profiler();
        this.world = new World(this);
        this.persistence = new PersistenceManager(this);
        this.item = Item;
        this.player = new Character(
            this.world,
            2,
            -1,
            955,
            Math.PI * 0.25,
            -Math.PI / 18
        );
        this.world.addEntity(this.player);

        addDefaultAudios();
        this.addContent();

        this.audio = new AudioManager();
        this.ui = new UIManager(this);
        this.render = new RenderManager(this, this.player);
        this.input = new InputManager(this);

        this.ui.icon.buildAllBlockTypeIcons(
            this.world.blockTextureUrl,
            this.world.blocks
        );
        this.player.inventory.updateAll();

        setInterval(this.gc.bind(this), 20000);
        setTimeout(this.init.bind(this), 0);
    }

    async init() {
        await this.world.assets.init();
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
                return; // Don't block for too long
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
