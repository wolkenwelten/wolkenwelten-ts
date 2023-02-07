import { Character } from './world/entity/character';
import { AudioManager } from './audio';
import { InputManager } from './input';
import { RenderManager } from './render/render';
import { PersistenceManager } from './persistence';
import { ProfilingManager } from './profiler';
import { UIManager } from './ui/ui';
import { World } from './world/world';

export interface GameConfig {
    parent: HTMLElement;
}

export class Game {
    config: GameConfig;
    persistence: PersistenceManager;
    profiler: ProfilingManager;
    world: World;

    audio: AudioManager;
    input: InputManager;
    render: RenderManager;
    ui: UIManager;
    player: Character;

    ticks = 1;
    startTime = +Date.now();
    ready = false;

    blockTextureUrl = '';

    constructor(config: GameConfig) {
        this.config = config;
        this.profiler = ProfilingManager.profiler();
        this.world = new World(this);
        this.player = new Character(
            this.world,
            2,
            0,
            955,
            Math.PI * 0.25,
            -Math.PI / 18
        );
        this.world.addEntity(this.player);
        this.persistence = new PersistenceManager(this);

        this.audio = new AudioManager(this);
        this.ui = new UIManager(this);
        this.render = new RenderManager(this, this.player);
        this.input = new InputManager(this);

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
