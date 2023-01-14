import { InputManager } from "./input";
import { RenderManager } from "./render";
import { World } from "./world";

export interface GameConfig {
    parent: HTMLElement,
}

export class Game {
    rootElement: HTMLElement;
    config: GameConfig;
    input: InputManager;
    render: RenderManager;
    world: World;


    ticks = 0;

    constructor (config: GameConfig) {
        this.config = config;
        this.rootElement = config.parent;
        this.input = new InputManager(this);
        this.render = new RenderManager(this);
        this.world = new World();
        setInterval(this.tick.bind(this), 1000.0 / 60.0);
    }

    tick () {
        this.input.tick();
    }
};
