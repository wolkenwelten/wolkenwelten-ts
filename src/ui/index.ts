import { Game } from "../game";

export class UIManager {
    game: Game;
    uiRoot: HTMLElement;
    fpsCounter: HTMLElement;

    constructor(game: Game) {
        this.game = game;
        this.uiRoot = document.createElement("div");
        this.uiRoot.id = 'wolkenwelten-ui-root';
        game.rootElement.append(this.uiRoot);

        this.fpsCounter = document.createElement("div");
        this.fpsCounter.id = "wolkenwelten-fps-counter";
        this.fpsCounter.innerText = 'FPS: ';
        this.uiRoot.append(this.fpsCounter);
    }

    updateFPS(fps:number) {
        this.fpsCounter.innerText = `FPS: ${fps}`;
    }
};