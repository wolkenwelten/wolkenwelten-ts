import { Character } from './world/entity/character';

import { InputManager } from './input';
import { RenderManager } from './render';
import { UIManager } from './ui';
import { World } from './world';
import { initDefaultBlocks } from './world/blockType/blockTypeDefaults';

import { LCG } from './util/prng';

export interface GameConfig {
    parent: HTMLElement;
}

export class Game {
    rootElement: HTMLElement;
    config: GameConfig;
    input: InputManager;
    render: RenderManager;
    ui: UIManager;
    player: Character;
    world: World;
    rng = new LCG(1234);
    ticks = 1;

    constructor(config: GameConfig) {
        this.config = config;
        this.rootElement = config.parent;
        this.world = new World(this);
        initDefaultBlocks();
        this.player = new Character(
            this.world,
            55,
            4,
            851,
            Math.PI * 0.25,
            -Math.PI / 18
        );
        this.world.addEntity(this.player);

        this.render = new RenderManager(this);
        this.render.cam = this.player;
        this.ui = new UIManager(this);
        this.input = new InputManager(this);
        setInterval(this.ui.updateDebugInfo.bind(this.ui), 100);
        setInterval(this.update.bind(this), 1000.0 / 60.0);
        setInterval(this.gc.bind(this), 20000);
    }

    update() {
        this.ticks++;
        this.input.update();
        this.world.update();
    }

    gc() {
        this.world.gc();
    }
}
