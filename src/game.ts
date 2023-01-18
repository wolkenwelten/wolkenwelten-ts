import { Character } from './entities/entities';
import './game.css';

import { InputManager } from './input/input';
import { RenderManager } from './render/render';
import { UIManager } from './ui/ui';
import { World } from './world/world';
import { initDefaultBlocks } from './world/blockTypeDefaults';

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
            -3,
            30.5,
            -4,
            Math.PI * 0.25,
            -Math.PI / 12
        );

        this.render = new RenderManager(this);
        this.render.cam = this.player;
        this.ui = new UIManager(this);
        this.input = new InputManager(this);
        setInterval(this.tick.bind(this), 1000.0 / 60.0);
    }

    tick() {
        this.input.tick();
    }
}
