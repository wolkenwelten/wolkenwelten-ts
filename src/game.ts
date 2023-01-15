import './game.css';

import { InputManager } from "./input";
import { RenderManager } from "./render";
import { UIManager } from "./ui";
import { World } from "./world";
import { initDefaultBlocks } from "./world/blockTypeDefaults";

export interface GameConfig {
    parent: HTMLElement,
}

export class Game {
    rootElement: HTMLElement;
    config: GameConfig;
    input: InputManager;
    render: RenderManager;
    ui: UIManager;
    world: World;
    ticks = 0;

    constructor (config: GameConfig) {
        this.config = config;
        this.rootElement = config.parent;
        this.world = new World();
        initDefaultBlocks();

        this.ui = new UIManager(this);
        this.input = new InputManager(this);
        this.render = new RenderManager(this);
        setInterval(this.tick.bind(this), 1000.0 / 60.0);
    }

    tick () {
        this.input.tick();
    }
};
