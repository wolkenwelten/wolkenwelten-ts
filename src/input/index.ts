import { Game } from "../game";

export class InputManager {
    game: Game;
    keystates: Set<string> = new Set();

    constructor (game: Game) {
        this.game = game;
        const that = this;

        window.addEventListener('keydown', (e) => that.keystates.add(e.code));
        window.addEventListener('keyup', (e) => that.keystates.delete(e.code));

        that.game.rootElement.addEventListener('click', (e) => {
            if(!document.pointerLockElement){
                that.game.rootElement.requestPointerLock();
            }
            if(!document.fullscreenElement){
                that.game.rootElement.requestFullscreen();
            }
        });
        document.addEventListener("mousemove", (e) => {
            if(document.pointerLockElement){
                that.game.player.rotate(e.movementX * -0.001, e.movementY * -0.001);
            }
        }, false);
    }

    tick() {
        const speed = this.keystates.has("ShiftLeft") ? 0.08 : 0.04;
        const movement = {x:0, y:0, z:0};

        if(this.keystates.has("KeyW")){ movement.z = -speed; }
        if(this.keystates.has("KeyS")){ movement.z =  speed; }
        if(this.keystates.has("KeyA")){ movement.x = -speed; }
        if(this.keystates.has("KeyD")){ movement.x =  speed; }
        if(this.keystates.has("KeyF")){ movement.y = -speed; }
        if(this.keystates.has("KeyR")){ movement.y =  speed; }
        if(this.keystates.has("Space")){ movement.y =  speed; }

        this.game.player.fly(movement.x, movement.y, movement.z);

        if(this.keystates.has("ArrowLeft")) { this.game.player.yaw   += speed*0.5; }
        if(this.keystates.has("ArrowRight")){ this.game.player.yaw   -= speed*0.5; }
        if(this.keystates.has("ArrowUp"))   { this.game.player.pitch -= speed*0.5; }
        if(this.keystates.has("ArrowDown")) { this.game.player.pitch += speed*0.5; }
    }
}