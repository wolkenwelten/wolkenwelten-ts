/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { isClient } from "../util/compat";
import { Character } from "../world/entity/character";
import type { ClientGame } from "./clientGame";

export class ControlState {
	x = 0;
	y = 0;
	z = 0;

	sprint = false;
	primary = false;
	secondary = false;

	usedGamepad = false;

	hotBar1 = false;
	hotBar2 = false;
	hotBar3 = false;
	hotBar4 = false;
}

export class InputManager {
	game: ClientGame;
	keyReleaseHandler: Map<string, () => void> = new Map();
	keyPushHandler: Map<string, () => void> = new Map();
	keyStates: Set<string> = new Set();
	mouseStates: Set<number> = new Set();
	gamepads: Gamepad[] = [];
	buttonCooldown: Map<number, number> = new Map();
	hotbarKeys: string[] = [];
	didDash = false;
	lastState: ControlState = new ControlState();
	touchState: ControlState | null = null;
	isTouchDevice = false;

	constructor(game: ClientGame) {
		this.game = game;
		const that = this;

		this.isTouchDevice = this.detectTouchDevice();

		if (isClient()) {
			window.addEventListener("keydown", (e) => {
				that.game.audio.maybeStartBGM();
				that.keyStates.add(e.code);
				const handler = that.keyPushHandler.get(e.code);
				if (that.game.ui.chat.visible()) {
					if (e.code === "Enter") {
						const msg = that.game.ui.chat.input.value.trim();
						if (msg.length > 0) {
							that.game.network.addLogEntry(msg);
						}
						that.game.ui.chat.hide();
					} else if (e.code === "Escape") {
						that.game.ui.chat.hide();
					}
					return;
				}
				if (handler) {
					handler();
				}
			});
			window.addEventListener("keyup", (e) => {
				that.game.audio.maybeStartBGM();
				that.keyStates.delete(e.code);
				if (!that.game.running || !that.game.ready) {
					return;
				}
				const handler = that.keyReleaseHandler.get(e.code);
				if (handler) {
					handler();
				}
			});
		}
		this.keyPushHandler.set("KeyN", () => {
			if (!that.game.running || !that.game.ready) {
				return;
			}
			if (!that.game.options.debug) {
				return;
			}
			if (that.game.player) {
				that.game.player.noClip = !that.game.player.noClip;
			}
		});
		this.keyPushHandler.set("Tab", () => {
			if (document.pointerLockElement) {
				document.exitPointerLock();
			}
		});
		this.keyPushHandler.set("Enter", () => {
			that.game.ui.chat.show();
		});

		that.game.render.canvasWrapper.addEventListener(
			"mousedown",
			async (e) => {
				if (!that.game.running || !that.game.ready) {
					return;
				}
				await that.requestFullscreenAndPointerLock();
			},
			false,
		);
		that.game.ui.rootElement.addEventListener("mousedown", (e) => {
			that.mouseStates.add(e.button);
			that.game.audio.maybeStartBGM();
		});
		that.game.ui.rootElement.addEventListener("contextmenu", (e) => {
			if (!that.game.running || !that.game.ready) {
				return;
			}
			e.preventDefault();
		});
		that.game.ui.rootElement.addEventListener("mouseup", (e) =>
			that.mouseStates.delete(e.button),
		);
		that.game.ui.rootElement.addEventListener(
			"mousemove",
			(e) => {
				if (document.pointerLockElement) {
					that.game.render.camera.rotate(
						e.movementX * -0.001,
						e.movementY * -0.001,
					);
				}
			},
			false,
		);
	}

	private detectTouchDevice(): boolean {
		return "ontouchstart" in window || navigator.maxTouchPoints > 0;
	}

	async requestFullscreenAndPointerLock() {
		if (!document.fullscreenElement) {
			this.game.player?.cooldown(15);
			if (this.game.ui.rootElement.requestFullscreen) {
				await this.game.ui.rootElement.requestFullscreen();
			}
		}
		if (!document.pointerLockElement) {
			this.game.player?.cooldown(15);
			await this.game.ui.rootElement.requestPointerLock();
		}
	}

	private updateKeyboard(state: ControlState) {
		if (this.game.ui.chat.visible()) {
			return;
		}
		if (this.keyStates.has("KeyW")) {
			state.z = -1;
		}
		if (this.keyStates.has("KeyS")) {
			state.z = 1;
		}
		if (this.keyStates.has("KeyA")) {
			state.x = -1;
		}
		if (this.keyStates.has("KeyD")) {
			state.x = 1;
		}
		if (this.keyStates.has("KeyF")) {
			state.y = -1;
		}
		if (this.keyStates.has("KeyR")) {
			state.y = 1;
		}
		if (this.keyStates.has("ShiftLeft")) {
			state.sprint = true;
		}
		if (this.keyStates.has("Space")) {
			state.y = 1;
		}
		if (this.keyStates.has("KeyP")) {
			if (!this.game.options.debug) {
				return;
			}
			this.game.player?.respawn();
		}

		if (this.keyStates.has("KeyQ")) {
			state.hotBar1 = true;
		}
		if (this.keyStates.has("Digit1")) {
			state.hotBar2 = true;
		}
		if (this.keyStates.has("KeyE")) {
			state.hotBar3 = true;
		}
		if (this.keyStates.has("Digit3")) {
			state.hotBar4 = true;
		}
	}

	private updateMouse(state: ControlState) {
		if (this.game.ui.chat.visible()) {
			return;
		}
		if (this.mouseStates.has(0)) {
			state.primary = true;
		}
		if (this.mouseStates.has(1)) {
			state.secondary = true;
		}

		if (this.mouseStates.has(2)) {
			state.secondary = true;
		}
	}

	private updateGamepad(
		state: ControlState,
		player: Character,
		gamepad: Gamepad,
	) {
		if (gamepad.axes.length >= 2) {
			const len = Math.sqrt(
				gamepad.axes[0] * gamepad.axes[0] + gamepad.axes[1] * gamepad.axes[1],
			);
			if (len > 0.16) {
				state.x = gamepad.axes[0];
				state.z = gamepad.axes[1];
				state.usedGamepad = true;
			}
		}
		if (gamepad.axes.length >= 4) {
			const len = Math.sqrt(
				gamepad.axes[2] * gamepad.axes[2] + gamepad.axes[3] * gamepad.axes[3],
			);
			if (len > 0.16) {
				this.game.render.camera.rotate(
					gamepad.axes[2] * -0.01,
					gamepad.axes[3] * -0.01,
				);
			}
		}
		if (gamepad.buttons[0]?.pressed) {
			state.y = 1;
		}
		if (gamepad.buttons[3]?.pressed) {
			state.sprint = true;
		}
		if (gamepad.buttons[2]?.pressed) {
			state.primary = true;
		}
		if (gamepad.buttons[3]?.pressed) {
			state.secondary = true;
		}
		if (gamepad.buttons[14]?.pressed) {
			const key = gamepad.index | (4 << 8);
			const cooldown = this.buttonCooldown.get(key) || 0;
			if (cooldown < this.game.ticks) {
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

		if (gamepad.buttons[4]?.pressed) {
			state.hotBar4 = true;
		}

		if (gamepad.buttons[5]?.pressed) {
			state.hotBar2 = true;
		}

		if (gamepad.buttons[7]?.pressed) {
			if (!gamepad.buttons[7].value || gamepad.buttons[7].value > 0.3) {
				state.hotBar1 = true;
			}
		}
		if (gamepad.buttons[6]?.pressed) {
			if (!gamepad.buttons[6].value || gamepad.buttons[6].value > 0.3) {
				state.hotBar3 = true;
			}
		}
	}

	private updateTouch(state: ControlState) {
		if (!this.touchState) return;

		if (this.touchState.usedGamepad) {
			state.x = this.touchState.x;
			state.z = this.touchState.z;
			state.usedGamepad = true;
		}

		if (this.touchState.primary) state.primary = true;
		if (this.touchState.secondary) state.secondary = true;
		if (this.touchState.y > 0) state.y = this.touchState.y;
		if (this.touchState.sprint) state.sprint = true;
	}

	update() {
		const state = new ControlState();
		this.updateKeyboard(state);
		this.updateMouse(state);
		this.updateTouch(state);

		const player = this.game.player;

		for (const gamepad of navigator.getGamepads()) {
			if (gamepad) {
				if (!player) {
					continue;
				}
				this.updateGamepad(state, player, gamepad);
			}
		}

		if (player?.noClip) {
			const speed = state.sprint ? 1.5 : 0.3;
			player.fly(state.x * speed, state.y * speed, state.z * speed);
		} else {
			this.game.render.camera.moveEntity(
				state.x,
				state.y,
				state.z,
				0.4,
				state.usedGamepad,
			);
			if (!this.didDash && state.sprint) {
				this.didDash = true;
				player?.dash();
			}
		}
		if (!state.sprint) {
			this.didDash = false;
		}
		if (player) {
			if (state.primary) {
				player.primaryAction();
				player.primaryHeld = true;
			} else {
				player.primaryHeld = false;
			}
			if (state.secondary) {
				player.secondaryAction();
				player.secondaryHeld = true;
			} else {
				player.secondaryHeld = false;
			}
		}

		this.lastState = state;
	}
}
