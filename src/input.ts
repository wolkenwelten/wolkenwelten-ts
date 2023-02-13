import { Game } from './game';

export class InputManager {
    game: Game;
    keyHandler: Map<string, () => void> = new Map();
    keyStates: Set<string> = new Set();
    mouseStates: Set<number> = new Set();
    gamepads: Gamepad[] = [];
    buttonCooldown: Map<number, number> = new Map();

    constructor(game: Game) {
        this.game = game;
        const that = this;
        setInterval(this.update.bind(this), 1000 / 240);
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
                    await that.game.ui.rootElement.requestFullscreen();
                }
                if (!document.pointerLockElement) {
                    that.game.player.cooldown(15);
                    await that.game.ui.rootElement.requestPointerLock();
                }
            },
            false
        );
        that.game.ui.rootElement.addEventListener('mousedown', (e) =>
            that.mouseStates.add(e.button)
        );
        that.game.ui.rootElement.addEventListener('mouseup', (e) =>
            that.mouseStates.delete(e.button)
        );
        that.game.ui.rootElement.addEventListener('wheel', (e) => {
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
        that.game.ui.rootElement.addEventListener(
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
        const movement = { x: 0, y: 0, z: 0, sneak: false };
        const actions = { primary: false, secondary: false };

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
        if (this.keyStates.has('ShiftLeft')) {
            movement.sneak = true;
        }

        const player = this.game.player;

        for (const gamepad of navigator.getGamepads()) {
            if (gamepad) {
                if (gamepad.axes.length >= 2) {
                    const len = Math.sqrt(
                        gamepad.axes[0] * gamepad.axes[0] +
                            gamepad.axes[1] * gamepad.axes[1]
                    );
                    if (len > 0.16) {
                        movement.x = gamepad.axes[0];
                        movement.z = gamepad.axes[1];
                    }
                }
                if (gamepad.axes.length >= 4) {
                    const len = Math.sqrt(
                        gamepad.axes[2] * gamepad.axes[2] +
                            gamepad.axes[3] * gamepad.axes[3]
                    );
                    if (len > 0.16) {
                        player.rotate(
                            gamepad.axes[2] * -0.01,
                            gamepad.axes[3] * -0.01
                        );
                    }
                }
                if (gamepad.buttons[0]?.pressed) {
                    movement.y = 1;
                }
                if (gamepad.buttons[2]?.pressed) {
                    movement.y = -1;
                }
                if (
                    gamepad.buttons[4]?.pressed ||
                    gamepad.buttons[5]?.pressed
                ) {
                    movement.sneak = true;
                }
                if (gamepad.buttons[14]?.pressed) {
                    const key = gamepad.index | (4 << 8);
                    const cooldown = this.buttonCooldown.get(key) || 0;
                    if (cooldown < this.game.ticks) {
                        const newSelection =
                            (player.inventory.selection - 1) %
                            player.inventory.items.length;
                        player.inventory.select(
                            newSelection >= 0
                                ? newSelection
                                : player.inventory.items.length -
                                      newSelection -
                                      2
                        );
                        this.buttonCooldown.set(key, this.game.ticks + 20);
                    }
                } else {
                    const key = gamepad.index | (4 << 8);
                    this.buttonCooldown.delete(key);
                }
                if (gamepad.buttons[15]?.pressed) {
                    const key = gamepad.index | (5 << 8);
                    const cooldown = this.buttonCooldown.get(key) || 0;
                    if (cooldown < this.game.ticks) {
                        const newSelection =
                            (player.inventory.selection + 1) %
                            player.inventory.items.length;
                        player.inventory.select(
                            newSelection >= 0
                                ? newSelection
                                : player.inventory.items.length -
                                      newSelection -
                                      2
                        );
                        this.buttonCooldown.set(key, this.game.ticks + 20);
                    }
                } else {
                    const key = gamepad.index | (5 << 8);
                    this.buttonCooldown.delete(key);
                }
                if (gamepad.buttons[8]?.pressed) {
                    player.noClip = true;
                }
                if (gamepad.buttons[9]?.pressed) {
                    player.noClip = false;
                }

                if (gamepad.buttons[7]?.pressed) {
                    if (
                        !gamepad.buttons[7].value ||
                        gamepad.buttons[7].value > 0.5
                    ) {
                        actions.primary = true;
                    }
                }
                if (gamepad.buttons[6]?.pressed) {
                    if (
                        !gamepad.buttons[6].value ||
                        gamepad.buttons[6].value > 0.5
                    ) {
                        actions.secondary = true;
                    }
                }
                //console.log(gamepad.buttons.map((b,i) => b.pressed ? `${i}: ${b.value}` : '').join(' '));
            }
        }

        if (player.noClip) {
            const speed = movement.sneak ? 1.5 : 0.3;
            player.fly(
                movement.x * speed,
                movement.y * speed,
                movement.z * speed
            );
        } else {
            const speed = movement.sneak ? 0.05 : 0.2;
            player.move(
                movement.x * speed,
                movement.y * speed,
                movement.z * speed
            );
        }

        this.game.player.miningActive = false;
        if (this.mouseStates.has(0)) {
            actions.primary = true;
        }

        if (this.mouseStates.has(2)) {
            actions.secondary = true;
        }

        if (actions.primary) {
            this.game.player.strike();
        }
        if (actions.secondary) {
            this.game.player.useItem();
        }
    }
}
