import { Game } from './game';

export class InputManager {
    game: Game;
    keyHandler: Map<string, () => void> = new Map();
    keyStates: Set<string> = new Set();
    mouseStates: Set<number> = new Set();

    constructor(game: Game) {
        this.game = game;
        const that = this;
        window.addEventListener('keydown', (e) => that.keyStates.add(e.code));
        window.addEventListener('keyup', (e) => {
            that.keyStates.delete(e.code);
            const handler = that.keyHandler.get(e.code);
            if (handler) {
                handler();
            }
        });
        this.keyHandler.set('KeyN', () => {
            that.game.player.noClip = !that.game.player.noClip;
        });
        this.keyHandler.set('Tab', () => {
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        });

        for (let i = 0; i < 10; i++) {
            this.keyHandler.set(`Digit${(i + 1) % 10}`, () => {
                this.game.player.inventory.select(i);
            });
        }

        that.game.render.canvasWrapper.addEventListener(
            'mousedown',
            async (e) => {
                if (!document.fullscreenElement) {
                    that.game.player.cooldown(15);
                    await that.game.rootElement.requestFullscreen();
                }
                if (!document.pointerLockElement) {
                    that.game.player.cooldown(15);
                    await that.game.rootElement.requestPointerLock();
                }
            },
            false
        );
        that.game.rootElement.addEventListener('mousedown', (e) =>
            that.mouseStates.add(e.button)
        );
        that.game.rootElement.addEventListener('mouseup', (e) =>
            that.mouseStates.delete(e.button)
        );
        that.game.rootElement.addEventListener('wheel', (e) => {
            const newSelection =
                (that.game.player.inventory.selection +
                    (e.deltaY > 0 ? 1 : -1)) %
                that.game.player.inventory.items.length;
            that.game.player.inventory.select(
                newSelection >= 0
                    ? newSelection
                    : that.game.player.inventory.items.length - newSelection - 2
            );
        });
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

    update() {
        const movement = { x: 0, y: 0, z: 0 };

        if (this.keyStates.has('KeyQ')) {
            this.game.player.dropItem();
        }
        if (this.keyStates.has('KeyW')) {
            movement.z = -1;
        }
        if (this.keyStates.has('KeyS')) {
            movement.z = 1;
        }
        if (this.keyStates.has('KeyA')) {
            movement.x = -1;
        }
        if (this.keyStates.has('KeyD')) {
            movement.x = 1;
        }
        if (this.keyStates.has('KeyF')) {
            movement.y = -1;
        }
        if (this.keyStates.has('KeyR')) {
            movement.y = 1;
        }
        if (this.keyStates.has('Space')) {
            movement.y = 1;
        }
        const player = this.game.player;
        if (player.noClip) {
            const speed = this.keyStates.has('ShiftLeft') ? 1.5 : 0.3;
            player.fly(
                movement.x * speed,
                movement.y * speed,
                movement.z * speed
            );
        } else {
            const speed = this.keyStates.has('ShiftLeft') ? 0.05 : 0.2;
            player.move(
                movement.x * speed,
                movement.y * speed,
                movement.z * speed
            );
        }

        this.game.player.miningActive = false;
        if (this.mouseStates.has(0)) {
            this.game.player.dig();
        }

        if (this.mouseStates.has(2)) {
            this.game.player.useItem();
        }
    }
}
