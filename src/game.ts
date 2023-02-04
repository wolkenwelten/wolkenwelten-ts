import { Character } from './world/entity/character';
import { InputManager } from './input';
import { RenderManager } from './render/render';
import { UIManager } from './ui/ui';
import { World } from './world/world';
import { initDefaultBlocks } from './world/blockType/blockTypeDefaults';
import { IconManager } from './util/icon';
import { LCG } from './util/prng';

export interface GameConfig {
    parent: HTMLElement;
}

export class Game {
    rootElement: HTMLElement;
    config: GameConfig;
    input: InputManager;
    icon: IconManager;
    render: RenderManager;
    ui: UIManager;
    player: Character;
    world: World;
    rng = new LCG(1234);
    ticks = 1;
    startTime = +Date.now();
    ready = false;
    blockTextureUrl = '';

    constructor(config: GameConfig) {
        this.config = config;
        this.rootElement = config.parent;
        this.icon = new IconManager(this);
        this.world = new World(this);
        initDefaultBlocks(this);
        this.icon.buildAllBlockTypeIcons();
        this.player = new Character(
            this.world,
            2,
            0,
            955,
            Math.PI * 0.25,
            -Math.PI / 18
        );
        this.world.addEntity(this.player);

        this.render = new RenderManager(this);
        this.render.cam = this.player;
        this.ui = new UIManager(this);
        this.input = new InputManager(this);
        setInterval(this.input.update.bind(this.input), 1000 / 240);
        setInterval(this.gc.bind(this), 20000);
        setTimeout(this.init.bind(this), 0);
    }

    async init() {
        await this.world.assets.init();
        this.ready = true;
    }

    // Run the game for a single tick
    update() {
        if (!this.ready) {
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
