import { Game } from "../game";

export class InputManager {
    game: Game;
    keystates: Set<string> = new Set();

    constructor (game: Game) {
        this.game = game;
        const that = this;

        window.addEventListener('keydown', (e) => {
            that.keystates.add(e.code);
        });
        window.addEventListener('keyup', (e) => {
            that.keystates.delete(e.code);
        });
    }

    tick() {
        if(this.keystates.has("KeyW")){
            this.game.render.cam.z -= 0.02;
        }
        if(this.keystates.has("KeyS")){
            this.game.render.cam.z += 0.02;
        }
        if(this.keystates.has("KeyA")){
            this.game.render.cam.x -= 0.02;
        }
        if(this.keystates.has("KeyD")){
            this.game.render.cam.x += 0.02;
        }
    }
}