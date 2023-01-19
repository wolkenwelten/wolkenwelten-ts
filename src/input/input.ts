import { Game } from '../game';

export class InputManager {
    game: Game;
    keystates: Set<string> = new Set();

    constructor(game: Game) {
        this.game = game;
        const that = this;

        window.addEventListener('keydown', (e) => that.keystates.add(e.code));
        window.addEventListener('keyup', (e) => that.keystates.delete(e.code));

        that.game.rootElement.addEventListener('mousedown', async (e) => {
            if (!document.fullscreenElement) {
                await that.game.rootElement.requestFullscreen();
            }
            if (!document.pointerLockElement) {
                await that.game.rootElement.requestPointerLock();
            }
        }, false);
        that.game.rootElement.addEventListener(
            'mousemove',
            (e) => {
                if (document.pointerLockElement) {
                    that.game.player.rotate(
                        e.movementX * -0.001,
                        e.movementY * -0.001
                    );
                }
            },
            false
        );
    }

    tick() {
        const speed = this.keystates.has('ShiftLeft') ? 0.2 : 0.05;
        const movement = { x: 0, y: 0, z: 0 };

        if (this.keystates.has('KeyW')) {
            movement.z = -speed;
        }
        if (this.keystates.has('KeyS')) {
            movement.z = speed;
        }
        if (this.keystates.has('KeyA')) {
            movement.x = -speed;
        }
        if (this.keystates.has('KeyD')) {
            movement.x = speed;
        }
        if (this.keystates.has('KeyF')) {
            movement.y = -speed;
        }
        if (this.keystates.has('KeyR')) {
            movement.y = speed;
        }
        if (this.keystates.has('Space')) {
            movement.y = speed;
        }
        if (this.keystates.has('Tab')) {
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }

        this.game.player.fly(movement.x, movement.y, movement.z);
    }
}
