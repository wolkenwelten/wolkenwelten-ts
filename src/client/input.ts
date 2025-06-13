/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * InputManager – Centralised browser-input aggregation for the client runtime
 *
 * The InputManager converts raw browser events (keyboard, mouse, gamepad and
 * touch) into a unified ControlState that the game loop can consume once every
 * tick via update().  It also performs a small amount of direct side-effects
 * (camera rotation, player dash, etc.) for latency-sensitive actions.
 *
 * Typical usage in ClientGame:
 *   const input = new InputManager(this);
 *   ...
 *   tick() {
 *     input.update();   // exactly once per tick
 *   }
 *
 * Extending / customising:
 * • Add new key handlers by inserting entries into `keyPushHandler` or
 *   `keyReleaseHandler` *before* update() is called.
 * • To support additional hardware, subclass InputManager and override the
 *   corresponding updateXXX() helper but remember to invoke super.updateXXX()
 *   so existing devices keep working.
 *
 * Footguns & caveats:
 * 1. update() must run before any code that queries player.primaryHeld etc.,
 *    otherwise the game will act on stale input.
 * 2. requestFullscreenAndPointerLock() quietly fails when the browser blocks
 *    the request (missing user gesture).  Callers should not assume either
 *    fullscreen or pointer-lock was granted.
 * 3. Gamepad support relies on the Standard mapping; non-standard controllers
 *    may yield funny button numbers.
 * 4. Touch devices that also have a track-pad/mouse will report both kinds of
 *    input – make sure your UI does not duplicate actions.
 * 5. Several methods reach into `this.game` for side-effects; when you mock or
 *    reuse the class outside the normal runtime you need to provide those
 *    members.
 *
 * See individual JSDoc comments below for per-method details.
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

	/**
	 * Simple heuristic to detect the presence of a touch screen.
	 * Be aware that hybrid devices may report both touch and mouse capabilities
	 * leading to duplicated input events upstream.
	 */
	private detectTouchDevice(): boolean {
		return "ontouchstart" in window || navigator.maxTouchPoints > 0;
	}

	/**
	 * Attempts to enter fullscreen and pointer-lock mode.  A short cooldown is
	 * applied to the local player to mitigate accidental clicks while browser UI
	 * elements are animating.  The promise resolves even if the browser silently
	 * rejects one of the requests – always check `document.fullscreenElement` and
	 * `document.pointerLockElement` if you need to know the result.
	 */
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

	/**
	 * Translates the currently active `keyStates` into the provided ControlState.
	 * The method is a pure mapper and performs no side-effects besides mutating
	 * `state`. It aborts early if the chat overlay is visible so that typing does
	 * not move the character.
	 */
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

	/**
	 * Maps the state of the primary mouse buttons into ControlState while the
	 * pointer is over the game canvas.  Pointer-lock is not required – the game
	 * will still respond to button presses during UI interactions.
	 */
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

	/**
	 * Merges a single `Gamepad` snapshot into ControlState and triggers small
	 * camera rotations. Assumes the Standard Gamepad layout (see MDN docs).
	 * Non-standard controllers may need additional mapping logic.
	 */
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

	/**
	 * Integrates the last ControlState produced by the touch UI overlay.  All the
	 * heavy logic lives inside the touch controller; this helper merely merges
	 * its latest snapshot into `state`.
	 */
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

	/**
	 * Entry-point called once per tick from ClientGame.  Aggregates input from
	 * all devices, applies movement to the camera and player, performs dash
	 * handling, and finally stores the state for potential consumption by other
	 * subsystems.
	 */
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
