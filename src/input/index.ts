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
        const speed = this.keystates.has("ShiftLeft") ? 0.03 : 0.015;
        if(this.keystates.has("KeyW")){
            this.game.render.cam.z -= speed;
        }
        if(this.keystates.has("KeyS")){
            this.game.render.cam.z += speed;
        }
        if(this.keystates.has("KeyA")){
            this.game.render.cam.x -= speed;
        }
        if(this.keystates.has("KeyD")){
            this.game.render.cam.x += speed;
        }

        if(this.keystates.has("ArrowLeft")){
            this.game.render.cam.yaw += speed;
        }
        if(this.keystates.has("ArrowRight")){
            this.game.render.cam.yaw -= speed;
        }
        if(this.keystates.has("ArrowUp")){
            this.game.render.cam.pitch -= speed;
        }
        if(this.keystates.has("ArrowDown")){
            this.game.render.cam.pitch += speed;
        }
    }
}