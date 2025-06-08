/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { ClientGame } from "../../clientGame";
import { Div } from "../utils";
import styles from "./touchControls.module.css";
import { ControlState } from "../../input";

export class TouchControls {
	container: HTMLElement;
	leftJoystick: HTMLElement;
	rightJoystick: HTMLElement;
	leftKnob: HTMLElement;
	rightKnob: HTMLElement;
	primaryButton: HTMLElement;
	secondaryButton: HTMLElement;
	jumpButton: HTMLElement;
	sprintButton: HTMLElement;

	game: ClientGame;
	visible = false;
	hideTimeout: number | null = null;
	isTouchDevice = false;

	// Joystick state
	leftActive = false;
	rightActive = false;
	leftTouchId: number | null = null;
	rightTouchId: number | null = null;

	// Control values
	moveX = 0;
	moveZ = 0;
	cameraX = 0;
	cameraY = 0;

	// Button states
	primaryActive = false;
	secondaryActive = false;
	jumpActive = false;
	sprintActive = false;
	hotbarActiveIndex = -1;

	constructor(parent: HTMLElement, game: ClientGame) {
		this.game = game;

		// Check if this is a touch device
		this.isTouchDevice = this.detectTouchDevice();

		// Create main container
		this.container = Div({ class: styles.touchControlsContainer });
		parent.appendChild(this.container);

		// Create joysticks
		this.leftJoystick = Div({
			class: `${styles.joystickContainer} ${styles.leftJoystick}`,
		});
		this.leftKnob = Div({ class: styles.joystickKnob });
		this.leftJoystick.appendChild(this.leftKnob);
		this.container.appendChild(this.leftJoystick);

		this.rightJoystick = Div({
			class: `${styles.joystickContainer} ${styles.rightJoystick}`,
		});
		this.rightKnob = Div({ class: styles.joystickKnob });
		this.rightJoystick.appendChild(this.rightKnob);
		this.container.appendChild(this.rightJoystick);

		// Create action buttons
		this.primaryButton = Div({
			class: `${styles.actionButton} ${styles.primaryButton}`,
		});
		this.primaryButton.textContent = "🔨";
		this.container.appendChild(this.primaryButton);

		this.secondaryButton = Div({
			class: `${styles.actionButton} ${styles.secondaryButton}`,
		});
		this.secondaryButton.textContent = "🛡️";
		this.container.appendChild(this.secondaryButton);

		this.jumpButton = Div({
			class: `${styles.actionButton} ${styles.jumpButton}`,
		});
		this.jumpButton.textContent = "⬆️";
		this.container.appendChild(this.jumpButton);

		this.sprintButton = Div({
			class: `${styles.actionButton} ${styles.sprintButton}`,
		});
		this.sprintButton.textContent = "🏃";
		this.container.appendChild(this.sprintButton);

		// Set initial position for joystick knobs
		this.resetJoysticks();

		// Setup touch event handlers only if this is a touch device
		if (this.isTouchDevice) {
			this.setupEventListeners();
		}
	}

	private detectTouchDevice(): boolean {
		// Check for touch capabilities
		return "ontouchstart" in window || navigator.maxTouchPoints > 0;
	}

	private setupEventListeners() {
		// Touch start events
		window.addEventListener("touchstart", (e) => {
			this.show();
			this.handleTouchStart(e);
		});

		// Touch move events
		window.addEventListener(
			"touchmove",
			(e) => {
				this.handleTouchMove(e);
			},
			{ passive: false },
		);

		// Touch end events
		window.addEventListener("touchend", (e) => {
			this.handleTouchEnd(e);
		});

		window.addEventListener("touchcancel", (e) => {
			this.handleTouchEnd(e);
		});

		// Button touch handlers
		this.setupButtonTouchHandlers();

		// Prevent mouse events from triggering on touch
		this.container.addEventListener("mousedown", (e) => {
			if (this.isTouchDevice) {
				e.stopPropagation();
			}
		});
	}

	private setupButtonTouchHandlers() {
		// Primary button
		this.primaryButton.addEventListener("touchstart", (e) => {
			e.preventDefault();
			this.primaryActive = true;
			this.primaryButton.style.transform = "scale(0.9)";
		});

		this.primaryButton.addEventListener("touchend", (e) => {
			e.preventDefault();
			this.primaryActive = false;
			this.primaryButton.style.transform = "scale(1)";
		});

		// Secondary button
		this.secondaryButton.addEventListener("touchstart", (e) => {
			e.preventDefault();
			this.secondaryActive = true;
			this.secondaryButton.style.transform = "scale(0.9)";
		});

		this.secondaryButton.addEventListener("touchend", (e) => {
			e.preventDefault();
			this.secondaryActive = false;
			this.secondaryButton.style.transform = "scale(1)";
		});

		// Jump button
		this.jumpButton.addEventListener("touchstart", (e) => {
			e.preventDefault();
			this.jumpActive = true;
			this.jumpButton.style.transform = "scale(0.9)";
		});

		this.jumpButton.addEventListener("touchend", (e) => {
			e.preventDefault();
			this.jumpActive = false;
			this.jumpButton.style.transform = "scale(1)";
		});

		// Sprint button
		this.sprintButton.addEventListener("touchstart", (e) => {
			e.preventDefault();
			this.sprintActive = true;
			this.sprintButton.style.transform = "scale(0.9)";
		});

		this.sprintButton.addEventListener("touchend", (e) => {
			e.preventDefault();
			this.sprintActive = false;
			this.sprintButton.style.transform = "scale(1)";
		});
	}

	private handleTouchStart(e: TouchEvent) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];
			const touchX = touch.clientX;
			const touchY = touch.clientY;

			// Check if touch is on left joystick
			if (
				!this.leftActive &&
				touchX < window.innerWidth / 2 &&
				touchY > window.innerHeight / 2
			) {
				this.leftActive = true;
				this.leftTouchId = touch.identifier;
				this.updateJoystickPosition(
					this.leftJoystick,
					this.leftKnob,
					touchX,
					touchY,
				);
			}

			// Check if touch is on right joystick
			if (
				!this.rightActive &&
				touchX > window.innerWidth / 2 &&
				touchY > window.innerHeight / 2
			) {
				this.rightActive = true;
				this.rightTouchId = touch.identifier;
				this.updateJoystickPosition(
					this.rightJoystick,
					this.rightKnob,
					touchX,
					touchY,
				);
			}
		}
	}

	private handleTouchMove(e: TouchEvent) {
		e.preventDefault();

		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];

			// Handle left joystick movement
			if (this.leftActive && touch.identifier === this.leftTouchId) {
				const rect = this.leftJoystick.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;

				// Calculate distance from center
				let dx = touch.clientX - centerX;
				let dy = touch.clientY - centerY;

				// Normalize to a circle with radius 1
				const distance = Math.sqrt(dx * dx + dy * dy);
				const maxRadius = rect.width / 2;

				if (distance > maxRadius) {
					dx = (dx / distance) * maxRadius;
					dy = (dy / distance) * maxRadius;
				}

				// Update knob position
				this.leftKnob.style.left = `${rect.width / 2 + dx}px`;
				this.leftKnob.style.top = `${rect.height / 2 + dy}px`;

				// Set movement values (-1 to 1 range)
				this.moveX = dx / maxRadius;
				this.moveZ = dy / maxRadius;
			}

			// Handle right joystick movement
			if (this.rightActive && touch.identifier === this.rightTouchId) {
				const rect = this.rightJoystick.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;

				// Calculate distance from center
				let dx = touch.clientX - centerX;
				let dy = touch.clientY - centerY;

				// Normalize to a circle with radius 1
				const distance = Math.sqrt(dx * dx + dy * dy);
				const maxRadius = rect.width / 2;

				if (distance > maxRadius) {
					dx = (dx / distance) * maxRadius;
					dy = (dy / distance) * maxRadius;
				}

				// Update knob position
				this.rightKnob.style.left = `${rect.width / 2 + dx}px`;
				this.rightKnob.style.top = `${rect.height / 2 + dy}px`;

				// Set camera values (-1 to 1 range)
				this.cameraX = dx / maxRadius;
				this.cameraY = dy / maxRadius;
			}
		}
	}

	private handleTouchEnd(e: TouchEvent) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];

			// Check if touch was for left joystick
			if (this.leftActive && touch.identifier === this.leftTouchId) {
				this.leftActive = false;
				this.leftTouchId = null;
				this.moveX = 0;
				this.moveZ = 0;
				this.resetLeftJoystick();
			}

			// Check if touch was for right joystick
			if (this.rightActive && touch.identifier === this.rightTouchId) {
				this.rightActive = false;
				this.rightTouchId = null;
				this.cameraX = 0;
				this.cameraY = 0;
				this.resetRightJoystick();
			}
		}

		this.scheduleHide();
	}

	private updateJoystickPosition(
		joystick: HTMLElement,
		knob: HTMLElement,
		x: number,
		y: number,
	) {
		const rect = joystick.getBoundingClientRect();
		knob.style.left = `${rect.width / 2}px`;
		knob.style.top = `${rect.height / 2}px`;
	}

	private resetJoysticks() {
		this.resetLeftJoystick();
		this.resetRightJoystick();
	}

	private resetLeftJoystick() {
		this.leftKnob.style.left = "50%";
		this.leftKnob.style.top = "50%";
	}

	private resetRightJoystick() {
		this.rightKnob.style.left = "50%";
		this.rightKnob.style.top = "50%";
	}

	show() {
		if (!this.visible && this.isTouchDevice) {
			this.visible = true;
			this.container.classList.add(styles.visible);
		}

		// Clear any existing hide timeout
		if (this.hideTimeout !== null) {
			window.clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}
	}

	hide() {
		if (this.visible) {
			this.visible = false;
			this.container.classList.remove(styles.visible);
		}
	}

	scheduleHide() {
		// Only schedule hide if no touches are active
		if (
			!this.leftActive &&
			!this.rightActive &&
			!this.primaryActive &&
			!this.secondaryActive &&
			!this.jumpActive &&
			!this.sprintActive &&
			this.hotbarActiveIndex === -1
		) {
			// Clear any existing timeout
			if (this.hideTimeout !== null) {
				window.clearTimeout(this.hideTimeout);
			}

			// Schedule hide after 30 seconds
			this.hideTimeout = window.setTimeout(() => {
				this.hide();
			}, 30000);
		}
	}

	update() {
		// Skip everything if not a touch device
		if (!this.isTouchDevice) return;

		// Apply camera rotation from right joystick
		if (
			this.rightActive &&
			(Math.abs(this.cameraX) > 0.1 || Math.abs(this.cameraY) > 0.1)
		) {
			this.game.render.camera.rotate(
				this.cameraX * -0.05,
				this.cameraY * -0.05,
			);
		}

		// Apply controls to control state
		if (this.game.input) {
			// Create a new clean state each time
			const state = new ControlState();

			// Apply movement from left joystick only when active
			if (this.leftActive) {
				state.x = this.moveX;
				state.z = this.moveZ;
				state.usedGamepad = true;
			}

			// Apply button states
			state.primary = this.primaryActive;
			state.secondary = this.secondaryActive;
			state.y = this.jumpActive ? 1 : 0;
			state.sprint = this.sprintActive;

			// Apply hotbar states
			state.hotBar1 = this.hotbarActiveIndex === 0;
			state.hotBar2 = this.hotbarActiveIndex === 1;
			state.hotBar3 = this.hotbarActiveIndex === 2;
			state.hotBar4 = this.hotbarActiveIndex === 3;

			// Set the touchState
			this.game.input.touchState = state;
		}
	}
}
