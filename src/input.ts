/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "./game";
import { isClient } from "./util/compat";
import { Item } from "./world/item/item";

export class InputManager {
	game: Game;
	keyReleaseHandler: Map<string, () => void> = new Map();
	keyPushHandler: Map<string, () => void> = new Map();
	keyStates: Set<string> = new Set();
	mouseStates: Set<number> = new Set();
	gamepads: Gamepad[] = [];
	buttonCooldown: Map<number, number> = new Map();
	hotbarKeys: string[] = [];

	constructor(game: Game) {
		this.game = game;
		const that = this;
		if (isClient()) {
			window.addEventListener("keydown", (e) => {
				that.keyStates.add(e.code);
				const handler = that.keyPushHandler.get(e.code);
				if (handler) {
					handler();
				}
			});
			window.addEventListener("keyup", (e) => {
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
		this.keyPushHandler.set("KeyO", () => {
			if (!that.game.running || !that.game.ready) {
				return;
			}
			that.toggleInventory();
		});
		this.keyPushHandler.set("Escape", () => {
			that.closeInventory();
			if (that.game.ui.chat.visible()) {
				that.game.ui.chat.hide();
			}
		});
		this.keyPushHandler.set("KeyN", () => {
			if (!that.game.running || !that.game.ready) {
				return;
			}
			that.game.player.noClip = !that.game.player.noClip;
		});
		this.keyPushHandler.set("Tab", () => {
			if (document.pointerLockElement) {
				document.exitPointerLock();
			}
		});
		this.keyPushHandler.set("Enter", () => {
			if (that.game.ui.chat.visible()) {
				const msg = that.game.ui.chat.input.value.trim();
				if (msg) {
					that.game.network.sendChat(msg);
				}
				that.game.ui.chat.hide();
			} else {
				that.game.ui.chat.show();
			}
		});

		for (let i = 0; i < 10; i++) {
			const hotbarKey = `Digit${(i + 1) % 10}`;
			this.hotbarKeys[i] = hotbarKey;
			this.keyPushHandler.set(hotbarKey, () => {
				const item = that.game.player.inventory.items[i];
				if (item === undefined) {
					return;
				}
				item.use(that.game.player);
			});

			this.keyReleaseHandler.set(hotbarKey, () => {
				const item = that.game.player.inventory.items[i];
				if (item === undefined) {
					return;
				}
				item.useRelease(that.game.player);
			});
		}

		if (isClient()) {
			that.game.render.canvasWrapper.addEventListener(
				"mousedown",
				async (e) => {
					if (!that.game.running || !that.game.ready) {
						return;
					}
					if (that.game.ui.inventory.active) {
						that.toggleInventory(true);
					}
					await that.requestFullscreenAndPointerLock();
				},
				false,
			);
			that.game.ui.rootElement.addEventListener("mousedown", (e) =>
				that.mouseStates.add(e.button),
			);
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
	}

	async requestFullscreenAndPointerLock() {
		if (!document.fullscreenElement) {
			this.game.player.cooldown(15);
			if (this.game.ui.rootElement.requestFullscreen) {
				await this.game.ui.rootElement.requestFullscreen();
			}
		}
		if (!document.pointerLockElement) {
			this.game.player.cooldown(15);
			await this.game.ui.rootElement.requestPointerLock();
		}
	}

	closeInventory() {
		if (this.isInventoryActive()) {
			this.toggleInventory();
		}
	}

	toggleInventory(dropHelItem = false) {
		this.game.ui.inventory.toggle();
		if (this.game.ui.inventory.active) {
			if (document.pointerLockElement) {
				document.exitPointerLock();
			}
		} else {
			if (!document.pointerLockElement) {
				this.game.player.cooldown(15);
				this.game.ui.rootElement.requestPointerLock();
			}
			if (this.game.ui.heldItem) {
				if (this.game.ui.heldItem instanceof Item) {
					if (
						dropHelItem ||
						!this.game.player.inventory.add(this.game.ui.heldItem)
					) {
						this.game.player.dropItem(this.game.ui.heldItem);
					}
				}
				this.game.ui.heldItem = undefined;
			}
		}
	}

	isInventoryActive() {
		return this.game.ui.inventory.active;
	}

	update() {
		const movement = { x: 0, y: 0, z: 0, sprint: false };
		const actions = { primary: false, secondary: false };

		if (this.keyStates.has("KeyW")) {
			movement.z = -1;
		}
		if (this.keyStates.has("KeyS")) {
			movement.z = 1;
		}
		if (this.keyStates.has("KeyA")) {
			movement.x = -1;
		}
		if (this.keyStates.has("KeyD")) {
			movement.x = 1;
		}
		if (this.keyStates.has("KeyF")) {
			movement.y = -1;
		}
		if (this.keyStates.has("KeyR")) {
			movement.y = 1;
		}
		if (this.keyStates.has("ShiftLeft")) {
			movement.sprint = true;
		}
		if (this.keyStates.has("Space")) {
			movement.y = 1;
		}

		const player = this.game.player;

		for (const gamepad of navigator.getGamepads()) {
			if (gamepad) {
				if (gamepad.axes.length >= 2) {
					const len = Math.sqrt(
						gamepad.axes[0] * gamepad.axes[0] +
							gamepad.axes[1] * gamepad.axes[1],
					);
					if (len > 0.16) {
						movement.x = gamepad.axes[0];
						movement.z = gamepad.axes[1];
					}
				}
				if (gamepad.axes.length >= 4) {
					const len = Math.sqrt(
						gamepad.axes[2] * gamepad.axes[2] +
							gamepad.axes[3] * gamepad.axes[3],
					);
					if (len > 0.16) {
						this.game.render.camera.rotate(
							gamepad.axes[2] * -0.01,
							gamepad.axes[3] * -0.01,
						);
					}
				}
				if (gamepad.buttons[0]?.pressed) {
					movement.y = 1;
				}
				if (gamepad.buttons[2]?.pressed) {
					movement.y = -1;
				}
				if (gamepad.buttons[4]?.pressed || gamepad.buttons[5]?.pressed) {
					movement.sprint = true;
				}
				if (gamepad.buttons[14]?.pressed) {
					const key = gamepad.index | (4 << 8);
					const cooldown = this.buttonCooldown.get(key) || 0;
					if (cooldown < this.game.ticks) {
						const newSelection =
							(player.inventory.selection - 1) % player.inventory.items.length;
						player.inventory.select(
							newSelection >= 0
								? newSelection
								: player.inventory.items.length - newSelection - 2,
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
							(player.inventory.selection + 1) % player.inventory.items.length;
						player.inventory.select(
							newSelection >= 0
								? newSelection
								: player.inventory.items.length - newSelection - 2,
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
					if (!gamepad.buttons[7].value || gamepad.buttons[7].value > 0.5) {
						actions.primary = true;
					}
				}
				if (gamepad.buttons[6]?.pressed) {
					if (!gamepad.buttons[6].value || gamepad.buttons[6].value > 0.5) {
						actions.secondary = true;
					}
				}
				//console.log(gamepad.buttons.map((b,i) => b.pressed ? `${i}: ${b.value}` : '').join(' '));
			}
		}

		if (player.noClip) {
			const speed = movement.sprint ? 1.5 : 0.3;
			player.fly(movement.x * speed, movement.y * speed, movement.z * speed);
		} else {
			const speed = movement.sprint ? 0.35 : 0.25;
			this.game.render.camera.moveEntity(
				movement.x,
				movement.y,
				movement.z,
				speed,
			);
		}

		for (let i = 0; i < 10; i++) {
			if (this.keyStates.has(this.hotbarKeys[i])) {
				this.game.ui.hotbar.use(i);
			}
		}

		if (this.mouseStates.has(0)) {
			actions.primary = true;
		}

		if (this.mouseStates.has(2)) {
			actions.secondary = true;
		}

		if (actions.primary) {
			this.game.player.primaryAction();
		}
		if (actions.secondary) {
			this.game.player.secondaryAction();
		}
	}
}
