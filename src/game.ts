import { Character } from './entities';
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
    player: Character;
    world: World;
    ticks = 0;

    constructor (config: GameConfig) {
        this.config = config;
        this.rootElement = config.parent;
        this.world = new World();
        initDefaultBlocks();
        this.player = new Character(-3, 30.5, -4, Math.PI * 1.25, -Math.PI / 12);

        this.render = new RenderManager(this);
        this.render.cam = this.player;
        this.ui = new UIManager(this);
        this.input = new InputManager(this);
        setInterval(this.tick.bind(this), 1000.0 / 60.0);
    }

    tick () {
        this.input.tick();
    }
};
