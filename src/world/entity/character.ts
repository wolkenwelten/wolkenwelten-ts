/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * # Character – the primary controllable entity
 *
 * This class models a humanoid entity that can be directly controlled by the
 * local player or remote clients.  It is the concrete implementation behind
 * both the **player avatar** and other player-like NPCs in the world.
 *
 * High-level responsibilities:
 *  • Transform player input (`move`, `dash`, `strike`, …) into physical motion
 *    and combat interactions inside the voxel world.
 *  • Provide a rich animation state machine for walking, jumping and melee
 *    attacks that the render pipeline can query in `draw()`.
 *  • Synchronise state with the networking layer through the inherited
 *    `serialize` / `deserialize` helpers so that authoritative servers and
 *    observing clients stay consistent.
 *
 * Extending the class:
 *  • **ALWAYS** call `super.update()` from an override so that critical physics
 *    and networking side-effects are preserved.  Skipping this will lead to
 *    desyncs, rubber-banding or the player falling through the world.
 *  • For custom combat logic, override `strike()` or `attack()` *instead* of
 *    `damage()`.  `damage()` has intricate block/knockback rules that are
 *    easy to break.
 *  • Use the provided hooks `onDeath` and `onAttack` for VFX/SFX; do **not**
 *    call `damage()` inside them or you will create infinite recursion.
 *
 * Footguns & common pitfalls:
 *  • `init()` hard-resets *all* transient state – including velocity,
 *    cooldowns and camera shakes.  Call it only when you really want to
 *    respawn the entity.
 *  • Healing is implemented via `damage(-amount)` – be mindful of sign errors.
 *  • `remainingAirActions` is decremented in both `dash()` *and* `move()`
 *    when jumping; forgetting to reset it in a subclass will brick aerial
 *    abilities.
 *  • Many timings are tied to `world.game.ticks`; when running the simulation
 *    at a non-default tick-rate be sure to scale your numbers accordingly.
 *  • The physics is *not* deterministic across clients – never trust `vx/vy/vz`
 *    from a remote player for hit detection.
 */
import { mat4 } from "gl-matrix";

import type { VoxelMesh } from "../../client/render/meshes/voxelMesh/voxelMesh";
import type { Entity } from "./entity";
import type { World } from "../world";
import type { Position } from "../../util/math";
import type { ClientGame } from "../../client/clientGame";
import { Being } from "./being";
import { GRAVITY } from "../../constants";
import { registerNetworkObject } from "./networkObject";

const CHARACTER_ACCELERATION = 0.08;
const CHARACTER_STOP_RATE = CHARACTER_ACCELERATION * 3.5;

const transPos = new Float32Array([0, 0, 0]);
const modelViewMatrix = mat4.create();

const clamp = (x: number, min: number, max: number) =>
	Math.min(Math.max(x, min), max);

export class Character extends Being {
	T = "Character";

	movementX = 0;
	movementY = 0;
	movementZ = 0;
	lastAction = 0;

	walkCycleCounter = 0;
	nextStepSound = 0;
	isWalking = false;
	isSprinting = false;
	mayDash = false;
	walkAnimationFactor = 0;
	jumpStart = -1;
	yStretch = 1;

	health = 24;
	maxHealth = 24;
	isDead = false;

	lastAttackerId = 0;
	lastAttackerCooldown = 0;

	repulsionMultiplier = 1;
	lastRepulsionMultiplierIncrease = -1;

	weight = 70;

	maxAirActions = 3;
	remainingAirActions = this.maxAirActions;

	justJumped = false;

	private animation = 0;
	private animationId = 0;
	knockoutTimer = 0;
	blockCharge = 0;

	public primaryCharge = 0;
	public primaryHeld = false;
	public secondaryHeld = false;

	/**
	 * Respawns the character by delegating to `init()`.  Useful when the player
	 * dies or when the server requests a hard reset.
	 */
	respawn() {
		this.init();
	}

	/**
	 * Starts a short animation sequence (64 ticks) and toggles the internal
	 * `animationId` so subsequent render calls can alternate between two key
	 * frames.
	 */
	startAnimation(_animationId = 0) {
		this.animation = 64;
		this.animationId = 1 - this.animationId;
	}

	/**
	 * Returns `true` while the character is in *blocking* stance (secondary
	 * action held down long enough).  Several combat functions query this flag
	 * to reduce incoming damage or disable movement abilities.
	 */
	isBlocking(): boolean {
		return this.blockCharge > 0;
	}

	serialize() {
		return {
			...super.serialize(),
			animation: this.animation,
			animationId: this.animationId,
			blockCharge: this.blockCharge,
		};
	}

	deserialize(data: any) {
		super.deserialize(data);
		this.animation = data.animation;
		this.animationId = data.animationId;
		this.blockCharge = data.blockCharge ?? 0;
	}

	/**
	 * Re-initialises the already constructed Character so it can be reused
	 * (e.g. after death or a server hand-off).  This is *not* called by the
	 * constructor – the ctor merely allocates the instance and then forwards
	 * to `init()` so that game code can choose to manually invoke it again.
	 *
	 * Side-effects: resets health, motion vectors, cooldowns and teleports the
	 * entity to the spawn position provided by the current world-generator.
	 */
	init() {
		this.noClip = false;
		this.isDead = false;
		this.maxHealth = this.health = 24;
		this.animation = -100;
		this.lastAction = 0;
		this.vx = this.vy = this.vz = 0;
		this.movementX = this.movementY = this.movementZ = 0;
		this.repulsionMultiplier = 1;

		this?.world?.game?.render?.camera?.stop();

		const [x, y, z] = this.world.worldgenHandler?.spawnPos(this) ?? [0, 0, 0];
		this.x = x;
		this.y = y;
		this.z = z;
		this.yaw = 0;
		this.pitch = 0;

		this.remainingAirActions = this.maxAirActions;
		this.justJumped = false;
		this.lastAttackerId = 0;
		this.lastAttackerCooldown = 0;
		this.knockoutTimer = 0;
	}

	constructor(world: World, id?: number) {
		super(world, id);
		this.init();
	}

	/**
	 * Applies raw damage before armour, blocking and knock-back reduction are
	 * taken into account.  Calling this with a *negative* value will heal the
	 * Character.  The function also updates `repulsionMultiplier`, a hidden
	 * parameter used by `beRepelledByEntities()` to resolve collision overlap.
	 */
	damage(rawAmount: number) {
		let actualAmount = rawAmount;
		let knockbackMultiplier = 1;

		// Check if player is blocking
		if (this.isBlocking()) {
			const ticksSinceBlockStart = this.blockCharge;

			// Super block: just entered blocking mode (within first few ticks)
			if (ticksSinceBlockStart <= 5) {
				// TODO: Add additional super block features in the future
				actualAmount = 0;
				knockbackMultiplier = 0;
			} else {
				// Regular block: reduce damage by 60% and knockback by 90%
				actualAmount *= 0.4; // 60% damage reduction
				knockbackMultiplier = 0.1; // 90% knockback reduction
			}
		}

		this.repulsionMultiplier += actualAmount * 0.05 * knockbackMultiplier;
		this.lastRepulsionMultiplierIncrease = this.world.game.ticks;
	}

	private autoDecreaseRepulsionMultiplier() {
		if (this.repulsionMultiplier === 1) {
			return;
		}
		if (this.lastRepulsionMultiplierIncrease < this.world.game.ticks - 500) {
			this.repulsionMultiplier = Math.max(1, this.repulsionMultiplier - 0.0001);
		}
	}

	/**
	 * Quick helper that heals by forwarding to `damage(-rawAmount)`.
	 * Prefer calling `heal()` over `damage(-x)` in game-logic for clarity.
	 */
	heal(rawAmount: number) {
		this.damage(-rawAmount);
	}

	/**
	 * Consumes one *air action* (unless the Character is grounded) and propels
	 * the player forward in the facing direction.  The method also spawns
	 * client-side dash particles and informs the server in multiplayer mode.
	 */
	dash() {
		if (this.mayJump() || this.remainingAirActions > 0) {
			if (this.isBlocking()) {
				return;
			}
			if (!this.mayJump()) {
				this.remainingAirActions--;
			}
			this.isSprinting = true;
			this.mayDash = false;
			const dashSpeed = this.knockoutTimer > 0 ? 0.2 : 0.6;
			this.world.game.render?.particle.fxDash(this.x, this.y - 0.5, this.z);
			const vx = Math.cos(-this.yaw - Math.PI / 2) * dashSpeed;
			const vz = Math.sin(-this.yaw - Math.PI / 2) * dashSpeed;
			this.vx = vx;
			this.vz = vz;
			this.vy += 0.1;
		}
	}

	/**
	 * Transforms local input coordinates (camera-relative) into world-space
	 * movement vectors and stores the desired velocity in `movementX/Y/Z`.
	 * The heavy physics lifting is deferred to the big `update()` loop.
	 */
	move(ox: number, oy: number, oz: number) {
		if (ox === 0 && oz === 0) {
			this.movementX = this.movementZ = 0;
			this.isWalking = false;
		} else {
			this.movementX = ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw);
			this.movementZ = ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw);
			this.isWalking = true;
		}
		this.movementY = oy > 0 ? 1 : 0;

		if (this.movementY === 0) {
			this.justJumped = false;
		}

		if (this.movementY > 0 && !this.justJumped) {
			if (this.mayJump() || this.remainingAirActions > 0) {
				if (this.isBlocking()) {
					return;
				}
				if (!this.mayJump()) {
					this.remainingAirActions--;
				}
				this.vy = this.knockoutTimer > 0 ? 0.1 : 0.3;
				this.jumpStart = this.world.game.ticks;
				this.justJumped = true;
				this.world.game.render?.particle.fxJump(this.x, this.y - 0.5, this.z);
				if (this.world.game.isClient) {
					const game = this.world.game as ClientGame;
					game.network.playerJump(this.x, this.y, this.z);
				}
			}
		}
	}

	/* Fly a player in a certain direction */
	fly(ox: number, oy: number, oz: number) {
		const [nox, noy, noz] = this.direction(ox, oy, oz);
		this.movementX = nox;
		this.movementY = noy;
		this.movementZ = noz;
	}

	rotate(yaw: number, pitch: number) {
		this.yaw = (this.yaw + yaw) % (Math.PI * 2);
		this.pitch = clamp(this.pitch + pitch, -Math.PI / 2, Math.PI / 2);
	}

	mayJump(): boolean {
		return this.world.isSolid(this.x, this.y - 1.7, this.z);
	}

	maySwim(): boolean {
		return this.world.isLiquid(this.x, this.y - 0.25, this.z);
	}

	collides() {
		return (
			Boolean(this.world.getBlock(this.x, this.y + 1, this.z)) ||
			Boolean(this.world.getBlock(this.x, this.y, this.z)) ||
			Boolean(this.world.getBlock(this.x, this.y - 1, this.z))
		);
	}

	isSolidPillar(x: number, y: number, z: number): boolean {
		return (
			this.world.isSolid(x, y, z) ||
			this.world.isSolid(x, y - 0.4, z) ||
			this.world.isSolid(x, y + 0.8, z)
		);
	}

	camOffY() {
		return Math.sin(this.walkCycleCounter) * 0.08;
	}

	/**
	 * The *heart* of the Character: runs once every tick and handles physics,
	 * collision, animation blending, cooldown timers and networking glitches.
	 *
	 * ⚠️  Because the method is >300 lines it is tempting to override it in a
	 * subclass.  Doing so is discouraged – instead hook into one of the many
	 * smaller helpers (`dash`, `strike`, `onAttack`, etc.) or propose splitting
	 * this method upstream.
	 */
	update() {
		// Generate velocity-based trail particles 🌀
		this.generateTrailParticles();

		// Handle ownership, loading and various early-exit conditions.
		if (this.earlyExitChecks()) {
			return;
		}

		// Blend walking animation & reset pitch
		this.updateWalkAnimation();

		// Freeze while surrounding chunks are not yet loaded
		if (!this.world.isLoaded(this.x, this.y, this.z)) {
			return;
		}

		const underwater = this.isUnderwater();
		const movementLength = Math.sqrt(
			this.movementX * this.movementX + this.movementZ * this.movementZ,
		);

		// Footstep sounds & walk-cycle bookkeeping
		this.handleWalkCycleAndSounds(movementLength);

		// The heavy physics + collision step
		this.physicsStep(underwater, movementLength);

		// Animation timers & combat charge bookkeeping
		this.updateTimersAndCharges();
	}

	/*
	 * ────────────────────────────────────────────────────────────────────────────
	 *  Extracted helper methods – strictly move code, no new behaviour!
	 * ────────────────────────────────────────────────────────────────────────────
	 */

	private generateTrailParticles() {
		const v = this.vx * this.vx + this.vz * this.vz + this.vy * this.vy;
		if (v > 0.075) {
			this.world.game.render?.particle.fxTrail(
				this.x,
				this.y - 1,
				this.z,
				v * 8,
			);
		}
	}

	/* Returns true if the update loop should bail out early */
	private earlyExitChecks(): boolean {
		if (this.ownerID !== this.world.game.networkID) {
			return true;
		}
		if (this.isInLoadingChunk()) {
			return true;
		}

		this.knockoutTimer = Math.max(0, this.knockoutTimer - 1);
		this.beRepelledByEntities();

		if (this.isDead) {
			return true;
		}

		if (this.y < this.world.bottomOfTheWorld) {
			this.die();
		}

		if (this.noClip) {
			this.vx = this.vy = this.vz = 0;
			this.x += this.movementX;
			this.y += this.movementY;
			this.z += this.movementZ;
			return true;
		}

		return false;
	}

	private updateWalkAnimation() {
		if (!this.isWalking) {
			this.walkAnimationFactor = this.walkAnimationFactor * 0.9;
		} else {
			const p =
				((this.world.game.ticks / (this.isSprinting ? 12 : 24)) & 1) * 2 - 1;
			if (this.mayJump()) {
				this.walkAnimationFactor = this.walkAnimationFactor * 0.9 + p * 0.1;
			} else {
				this.walkAnimationFactor = this.walkAnimationFactor * 0.97 + p * 0.03;
			}
		}
		// Head always stays horizontal in first-person
		this.pitch = 0;
	}

	private handleWalkCycleAndSounds(movementLength: number) {
		this.walkCycleCounter += Math.min(0.2, movementLength);
		if (this.walkCycleCounter > this.nextStepSound && this.mayJump()) {
			this.nextStepSound = this.walkCycleCounter + 6;
			this.world.game.audio?.play("step", 0.5);
		}
	}

	/* Complete physics step including velocity integration & collision response */
	private physicsStep(underwater: boolean, movementLength: number) {
		let speed = 0.6;
		let accel =
			movementLength > 0.01 ? CHARACTER_ACCELERATION : CHARACTER_STOP_RATE;

		if (this.isBlocking() || this.primaryCharge > 0) {
			speed *= 0.25;
		}

		if (!this.mayJump()) {
			accel *= 0.2; // Air-control nerf while jumping
			if (this.jumpStart < 0) {
				this.jumpStart = this.world.game.ticks - 1;
			}
		} else {
			this.jumpStart = -1;
			this.mayDash = true;
			this.remainingAirActions = this.maxAirActions;
			if (this.lastAttackerCooldown > 0) {
				this.lastAttackerCooldown--;
			}
		}
		if (this.lastAttackerCooldown === 0 && this.lastAttackerId !== 0) {
			this.lastAttackerId = 0;
		}
		if (underwater) {
			speed *= 0.5; // Swimming is slower
		}
		if (this.lastAction > this.world.game.ticks) {
			speed *= 0.5;
		}
		if (this.knockoutTimer > 0) {
			speed *= 0.2;
			accel *= 0.6;
		}

		// Integrate movement
		this.vx = this.vx * (1.0 - accel) + this.movementX * speed * accel;
		this.vz = this.vz * (1.0 - accel) + this.movementZ * speed * accel;
		this.vy -= underwater ? GRAVITY * 0.2 : GRAVITY;
		const oldVx = this.vx;
		const oldVy = this.vy;
		const oldVz = this.vz;

		if (underwater) {
			this.vy *= 0.98;
			this.vx *= 0.99;
			this.vz *= 0.99;
		} else if (this.movementY > 0 && this.mayJump()) {
			this.vy = 0.25;
			this.jumpStart = this.world.game.ticks;
			this.world.game.render?.particle.fxJump(this.x, this.y - 0.5, this.z);
		}
		if (this.movementY > 0 && this.maySwim() && Math.abs(this.vy) < 0.07) {
			this.vy = 0.06;
		}

		// Collision clamps
		if (this.isSolidPillar(this.x - 0.4, this.y - 0.8, this.z)) {
			this.vx = Math.max(this.vx, 0);
		}
		if (this.isSolidPillar(this.x + 0.4, this.y - 0.8, this.z)) {
			this.vx = Math.min(this.vx, 0);
		}
		if (this.world.isSolid(this.x, this.y - 1.7, this.z)) {
			this.vy = Math.max(this.vy, 0);
		}
		if (this.world.isSolid(this.x, this.y + 0.7, this.z)) {
			this.vy = Math.min(this.vy, 0);
		}
		if (this.isSolidPillar(this.x, this.y - 0.8, this.z - 0.4)) {
			this.vz = Math.max(this.vz, 0);
		}
		if (this.isSolidPillar(this.x, this.y - 0.8, this.z + 0.4)) {
			this.vz = Math.min(this.vz, 0);
		}

		// Impact force / fall damage
		const dx = this.vx - oldVx;
		const dy = this.vy - oldVy;
		const dz = this.vz - oldVz;
		const force = Math.sqrt(dx * dx + dy * dy + dz * dz);
		if (force > 0.2) {
			this.world.game.audio?.play("stomp", 0.5);
		}
		if (force > 0.1) {
			const amount = Math.floor(force * 2);
			if (amount > 0) {
				this.damage(amount * amount);
			}
		}

		// Prevent absurd velocity explosions
		const len = this.vx * this.vx + this.vz * this.vz + this.vy * this.vy;
		if (len > 4 * 4 * 4) {
			this.vx *= 0.95;
			this.vy *= 0.95;
			this.vz *= 0.95;
		}
		this.autoDecreaseRepulsionMultiplier();

		// Integrate position
		this.x += this.vx;
		this.y += this.vy;
		this.z += this.vz;
	}

	private updateTimersAndCharges() {
		// Animation countdown
		this.animation = Math.max(0, Math.min(64, this.animation - 1));

		// Primary (left-mouse) charge logic
		if (this.primaryHeld) {
			this.primaryCharge++;
		} else if (this.primaryCharge > 0) {
			if (this.primaryCharge > 24) {
				this.strike(true);
			} else {
				this.strike();
			}
			this.primaryCharge = 0;
		}

		// Secondary (right-mouse) block logic
		if (this.secondaryHeld) {
			this.blockCharge++;
		} else if (this.blockCharge > 0) {
			if (++this.blockCharge > 24) {
				this.blockCharge = 0;
			}
		}
	}

	cooldown(ticks: number) {
		this.lastAction = this.world.game.ticks + ticks;
	}

	doDamage(target: Being, damage: number) {
		target.damage(damage);
		target.onAttack(this);
	}

	attack(radius = 1.6, heave = false): boolean {
		const [vx, vy, vz] = this.direction(0, 0, radius * -0.6);
		const x = this.x + vx;
		const y = this.y + vy;
		const z = this.z + vz;
		let hit = false;

		const br = radius * 0.5;
		for (let cx = Math.floor(x - br); cx < Math.ceil(x + br); cx++) {
			for (let cy = Math.floor(y - br); cy < Math.ceil(y + br - 0.5); cy++) {
				for (let cz = Math.floor(z - br); cz < Math.ceil(z + br); cz++) {
					const b = this.world.getBlock(cx, cy, cz);
					if (b) {
						const bt = this.world.blocks[b];
						const maxHealth = heave ? 500 : 200;
						if (bt.health < maxHealth) {
							this.world.setBlock(cx, cy, cz, 0);
							this.world.game.render?.particle.fxBlockBreak(cx, cy, cz, bt);
							this.playUnmovingSound("tock", 0.1);
						}
					}
				}
			}
		}
		this.playUnmovingSound("punchMiss", 0.4);

		return hit;
	}

	/* Callback function that gets called when this Character dies */
	onDeath() {
		this.playUnmovingSound("ungh", 0.2);
		if (this.world.game.isClient) {
			const game = this.world.game as any;
			game.network.playerDeath(this.lastAttackerId);
		}
		//this.world.game.ui.hotbar.clear();
		this.init();
	}

	/* Callback function that gets called whenever this character is attacked */
	onAttack(perpetrator: Entity): void {
		if (this === this.world.game?.player) {
			this.world.game.render?.canvasWrapper.classList.remove("fx-damage");
			this.world.game.render?.canvasWrapper.getBoundingClientRect();
			this.world.game.render?.canvasWrapper.classList.add("fx-damage");
		}
		this.world.game.audio?.play("ungh", 0.2);
	}

	/* Return true when the character shouldn't be able to do anything */
	isOnCooldown(): boolean {
		return this.world.game.ticks < this.lastAction;
	}

	/**
	 * Performs a *melee strike* with the currently equipped item or bare hands.
	 * Handles animation blending, camera shake, damage calculation and server
	 * RPC.  Use the `heavy` flag for charged attacks that cause higher damage
	 * and knockback.
	 */
	strike(heavy = false) {
		if (this.world.game.ticks < this.lastAction) {
			return;
		}
		if (this.isBlocking()) {
			return;
		}

		this.animation = this.world.game.render?.frames || 0;
		const hit = this.attack(1.8, heavy);
		const cooldownDur = heavy ? 14 : 10;
		this.animationId = (this.animationId + 1) & 1;
		if (heavy) {
			this.animationId = 0;
		}

		const cam = this.world.game.render?.camera;
		if (cam?.entityToFollow === this) {
			cam.shake(heavy ? 0.75 : hit ? 0.5 : 0.25);
		}

		this.cooldown(cooldownDur);
		if (hit || heavy) {
			this.playSound("punch", 0.3);
		} else {
			this.playSound("punchMiss", 0.2);
		}
		const px = this.x + Math.cos(-this.yaw - Math.PI / 2);
		const py = this.y - 0.9;
		const pz = this.z + Math.sin(-this.yaw - Math.PI / 2);
		this.world.game.render?.particle.fxStrike(px, py, pz, heavy);

		if (heavy) {
			const vx = Math.cos(-this.yaw - Math.PI / 2) * -0.1;
			const vz = Math.sin(-this.yaw - Math.PI / 2) * -0.1;
			this.vx = vx;
			this.vz = vz;
			this.vy += 0.05;
		}

		// Send hit message to server
		if (this.world.game.isClient) {
			const game = this.world.game as ClientGame;
			const radius = 1.8;
			const damage = heavy ? 12 : 4;
			game.network.playerHit(
				this.id,
				radius,
				damage,
				px,
				py,
				pz,
				this.x,
				this.y,
				this.z,
				game.networkID,
				heavy,
			);
		}
	}

	/* Use the current item or punch if we don't have anything equipped */
	primaryAction() {
		this.primaryHeld = true;
	}

	/* Use whatever skill is currently selected */
	secondaryAction() {}

	drawBodyPart(
		projectionMatrix: mat4,
		viewMatrix: mat4,
		alpha: number,
		x: number,
		y: number,
		z: number,
		yaw: number,
		pitch: number,
		mesh: VoxelMesh,
		bx = 0,
		by = 0,
		bz = 0,
	) {
		mat4.identity(modelViewMatrix);
		transPos[0] = this.x;
		transPos[1] = this.y;
		transPos[2] = this.z;
		mat4.translate(modelViewMatrix, modelViewMatrix, transPos);
		mat4.rotateY(modelViewMatrix, modelViewMatrix, this.yaw);
		mat4.rotateX(modelViewMatrix, modelViewMatrix, this.pitch);
		transPos[0] = x;
		transPos[1] = y;
		transPos[2] = z;
		mat4.translate(modelViewMatrix, modelViewMatrix, transPos);
		mat4.rotateY(modelViewMatrix, modelViewMatrix, yaw);
		mat4.rotateX(modelViewMatrix, modelViewMatrix, pitch);
		transPos[0] = bx;
		transPos[1] = by;
		transPos[2] = bz;
		mat4.translate(modelViewMatrix, modelViewMatrix, transPos);
		mat4.mul(modelViewMatrix, viewMatrix, modelViewMatrix);
		mat4.mul(modelViewMatrix, projectionMatrix, modelViewMatrix);
		mesh.draw(modelViewMatrix, alpha);
	}

	private updateYStretch() {
		if (this.jumpStart == this.world.game.ticks) {
			this.yStretch = 0.75;
		} else {
			if (this.mayJump()) {
				this.yStretch = this.yStretch * 0.95 + 1 * 0.05;
			} else {
				this.yStretch = this.yStretch * 0.98 + 1.15 * 0.02;
			}
		}
	}

	calcHeadYaw(_cam: Position): number {
		return 0;
	}

	draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Position) {
		if (!this.world.game.render) {
			return;
		}
		this.world.game.render?.decals.addShadow(this.x, this.y, this.z, 0.75);
		const dx = this.x - cam.x;
		const dy = this.y - cam.y;
		const dz = this.z - cam.z;
		const d = Math.cbrt(dx * dx + dy * dy + dz * dz);
		const renderDistance = this.world.game.render?.renderDistance || 0;
		const alpha = Math.min(1, Math.max(0, renderDistance - d) / 8);

		const speedPitch = Math.max(-0.2, this.getSpeed() * -0.5);

		const headYaw = this.calcHeadYaw(cam);
		let headPitch = this.walkAnimationFactor * 0.1 + cam.pitch * 0.25;
		let bodyPitch = this.walkAnimationFactor * -0.1 + speedPitch;
		let leftArmPitch = this.walkAnimationFactor * 1.4;
		let rightArmPitch = this.walkAnimationFactor * -1.4;
		let leftArmYaw = this.walkAnimationFactor * -0.5;
		let rightArmYaw = this.walkAnimationFactor * -0.5;
		let rightLegPitch = this.walkAnimationFactor * 1.6;
		let leftLegPitch = this.walkAnimationFactor * -1.6;

		this.updateYStretch();
		let yStretch = this.yStretch;
		let yOff = 0;

		// Blocking animation - put arms up in defensive position
		if (this.isBlocking()) {
			const t = Math.min(this.blockCharge, 8) * (1 / 8);

			leftArmPitch =
				(2 + leftArmPitch * 0.1) * t + leftArmPitch * 1.2 * (1 - t); // Left arm up
			leftArmYaw = -0.6 * t;
			rightArmPitch =
				(2 + rightArmPitch * 0.1) * t + rightArmPitch * 1.2 * (1 - t); // Right arm up
			rightArmYaw = 0.6 * t;
			leftLegPitch -= 0.3 * t;
			rightLegPitch += 0.3 * t;
			headPitch -= 0.4 * t; // Head slightly tilted back
			bodyPitch += 0.15 * t; // Body slightly leaning back
		} else if (this.primaryCharge > 0) {
			const t = Math.max(0, Math.min(64, this.primaryCharge) * (1 / 4));
			rightArmPitch = (t / 16) * 1.5;
			rightArmYaw = (t / 16) * -1.5;

			leftArmPitch = (t / 16) * -0.5;
			leftArmYaw = (t / 16) * -0.5;

			headPitch += (t / 16) * -0.2;
			yStretch += (t / 16) * 0.2;
			yOff += (t / 16) * 0.25;
		} else if (this.animation > 0) {
			const t = Math.max(0, Math.min(64, this.animation) * (1 / 4));
			rightArmPitch = (t / 16) * 1.5;
			rightArmPitch *= rightArmPitch;
			leftArmPitch = rightArmPitch * -0.5;
			leftArmYaw = (t / 16) * -0.5;
			rightArmYaw = leftArmYaw * -1;

			leftLegPitch += rightArmPitch * 0.3;
			rightLegPitch += rightArmPitch * -0.3;
			headPitch += rightArmPitch * 0.1;

			if (this.animationId === 1) {
				const tmp = rightArmPitch;
				rightArmPitch = leftArmPitch;
				leftArmPitch = tmp;
			}
		}

		const {
			playerHead,
			playerTorso,
			playerLeftArm,
			playerLeftLeg,
			playerRightArm,
			playerRightLeg,
		} = this.world.game.render.assets;

		this.drawBodyPart(
			projectionMatrix,
			viewMatrix,
			alpha,
			0,
			-0.175 * yStretch + yOff,
			0.05,
			headYaw,
			headPitch,
			playerHead,
		);
		this.drawBodyPart(
			projectionMatrix,
			viewMatrix,
			alpha,
			0,
			-0.95 * yStretch + yOff,
			-0.0125,
			0,
			bodyPitch,
			playerTorso,
		);
		this.drawBodyPart(
			projectionMatrix,
			viewMatrix,
			alpha,
			-0.45,
			-0.625 * yStretch + yOff,
			0,
			leftArmYaw,
			leftArmPitch,
			playerLeftArm,
			0,
			-0.225,
			0,
		);
		this.drawBodyPart(
			projectionMatrix,
			viewMatrix,
			alpha,
			0.45,
			-0.625 * yStretch + yOff,
			0,
			rightArmYaw,
			rightArmPitch,
			playerRightArm,
			0,
			-0.225,
			0,
		);
		this.drawBodyPart(
			projectionMatrix,
			viewMatrix,
			alpha,
			0.125,
			-1.35 * yStretch + yOff,
			0,
			0,
			rightLegPitch,
			playerRightLeg,
			0,
			-0.2,
			0,
		);
		this.drawBodyPart(
			projectionMatrix,
			viewMatrix,
			alpha,
			-0.125,
			-1.35 * yStretch + yOff,
			0,
			0,
			leftLegPitch,
			playerLeftLeg,
			0,
			-0.2,
			0,
		);
	}

	// Helper method to get player name - moved to a separate method for the render pipeline to use
	getPlayerName(): string | null {
		// Only show names for other players (not ourselves)
		if (this === this.world.game.player) {
			return null;
		}

		// Get player name from the client registry
		if (this.world.game.isClient) {
			const game = this.world.game as any;
			const client = game.clients.get(this.ownerID);
			if (client) {
				let name = client.name;
				if (client.status === "typing") {
					name = "💬 " + name;
				} else if (client.status === "afk") {
					name = "💤 " + name;
				} else if (client.status === "dead") {
					name = "💀 " + name;
				}
				return name;
			}
		}

		return null;
	}

	mesh() {
		return this.world.game.render?.assets.playerHead || null;
	}
}
registerNetworkObject("Character", Character);
