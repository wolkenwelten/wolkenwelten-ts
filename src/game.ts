/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { AudioManager } from './audio';
import { registerAudioContent } from './content/audioContent';
import { registerBlockTypes } from './content/blockTypes';
import { registerCraftingRecipes } from './content/craftingRecipes';
import { registerItems } from './content/itemContent';
import { registerMobs } from './content/mobContent';
import { registerSkills } from './content/skillContent';
import { registerStaticObjects } from './content/staticObjects';
import { initWorldgen } from './content/worldgen/assets';
import { InputManager } from './input';
import { Options } from './options';
import { PersistenceManager } from './persistence';
import { ProfilingManager } from './profiler';
import { RenderManager } from './render/render';
import { UIManager } from './ui/ui';
import { Character } from './world/entity/character';
import { StaticObject } from './world/chunk/staticObject';
import { CraftingRecipe } from './world/crafting';
import { Mob } from './world/entity/mob';
import { Item } from './world/item/item';
import { Skill } from './world/skill';
import { World } from './world/world';

export interface GameConfig {
    parent: HTMLElement;
}

export interface BlockTypeRegistry {
    [key: string]: number;
}

export class Game {
    Item: typeof Item;
    Mob: typeof Mob;
    CraftingRecipe: typeof CraftingRecipe;
    Skill: typeof Skill;
    StaticObject: typeof StaticObject;

    audio: AudioManager;
    blocks: BlockTypeRegistry = {};
    config: GameConfig;
    input: InputManager;
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

    constructor(config: GameConfig) {
        this.Item = Item;
        this.Mob = Mob;
        this.CraftingRecipe = CraftingRecipe;
        this.Skill = Skill;
        this.StaticObject = StaticObject;

        this.config = config;
        this.options = new Options();
        this.profiler = ProfilingManager.profiler();
        this.world = new World(this);
        this.player = new Character(
            this.world,
            2,
            -1,
            955,
            Math.PI * 0.25,
            -Math.PI / 18
        );
        this.world.addEntity(this.player);
        this.persistence = new PersistenceManager(this);
        this.audio = new AudioManager();

        this.addContent();

        this.ui = new UIManager(this);
        this.render = new RenderManager(this, this.player);
        this.input = new InputManager(this);

        setInterval(this.gc.bind(this), 20000);
        setTimeout(this.init.bind(this), 0);
    }

    addContent() {
        registerAudioContent(this.audio);
        registerItems();
        registerBlockTypes(this.world);
        registerStaticObjects();
        registerSkills();
        registerMobs();
        registerCraftingRecipes(this.world);
    }

    async init() {
        const worldgenHandler = await initWorldgen();
        this.world.worldgenHandler = worldgenHandler;
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
