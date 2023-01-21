import { Character } from './world/entity/character';

import { InputManager } from './input';
import { RenderManager } from './render';
import { UIManager } from './ui';
import { World } from './world';
import { initDefaultBlocks } from './world/blockType/blockTypeDefaults';

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
    ticks = 1;

    constructor(config: GameConfig) {
        this.config = config;
        this.rootElement = config.parent;
        this.world = new World(this);
        initDefaultBlocks();
        this.player = new Character(
            -16,
            30.5,
            -16,
            Math.PI * 0.25,
            -Math.PI / 12
        );
        this.world.addEntity(this.player);

        this.render = new RenderManager(this);
        this.render.cam = this.player;
        this.ui = new UIManager(this);
        this.input = new InputManager(this);
        setInterval(this.ui.updateDebugInfo.bind(this.ui), 100);
        setInterval(this.update.bind(this), 1000.0 / 60.0);
        setInterval(this.gc.bind(this), 15000);
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
