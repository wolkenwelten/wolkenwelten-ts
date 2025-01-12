/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";

import type { VoxelMesh } from "../../render/meshes/voxelMesh/voxelMesh";
import type { Entity } from "./entity";
import type { World } from "../world";
import type { Position } from "../../util/math";
import { Being } from "./being";
import { ItemDrop } from "./itemDrop";
import { Inventory } from "../item/inventory";
import { Item, MaybeItem } from "../item/item";

const CHARACTER_ACCELERATION = 0.08;
const CHARACTER_STOP_RATE = CHARACTER_ACCELERATION * 3.5;

const transPos = new Float32Array([0, 0, 0]);
const modelViewMatrix = mat4.create();

const clamp = (x: number, min: number, max: number) =>
	Math.min(Math.max(x, min), max);

export class Character extends Being {
	movementX = 0;
	movementY = 0;
	movementZ = 0;
	lastAction = 0;
	hitAnimation = -100;
	walkCycleCounter = 0;
	nextStepSound = 0;
	isWalking = false;
	isSprinting = false;
	mayDash = false;
	walkAnimationFactor = 0;
	jumpStart = -1;
	yStretch = 1;

	inertiaX = 0;
	inertiaZ = 0;

	health = 24;
	maxHealth = 24;
	isDead = false;

	weight = 70;

	equipment: Inventory;
	inventory: Inventory;

	maxAirActions = 3;
	remainingAirActions = this.maxAirActions;

	justJumped = false;

	/* Simple cheat, can be run from the browser console by typing `wolkenwelten.player.getGoodStuff();` */
	getGoodStuff() {
		this.inventory.add(Item.create("earthBullet", this.world));
		this.inventory.add(Item.create("earthWall", this.world));
		this.inventory.add(Item.create("fireBreath", this.world));
		this.inventory.add(Item.create("comet", this.world));
		this.inventory.add(Item.create("stone", this.world, 50));

		//this.equipment.items[0] = Item.create('club', this.world);
	}

	respawn() {
		this.init();
	}

	/* Initialize an already existing Character, that way we can easily reuse the same object, */
	init() {
		this.noClip = false;
		this.isDead = false;
		this.maxHealth = this.health = 24;
		this.hitAnimation = -100;
		this.lastAction = 0;
		this.vx = this.vy = this.vz = 0;
		this.movementX = this.movementY = this.movementZ = 0;

		this?.world?.game?.render?.camera?.stop();
		this.effects.clear();
		this.inventory.clear();
		this.equipment.clear();
		this.inventory.select(0);

		const [x, y, z] = this.world.worldgenHandler?.spawnPos(this) ?? [0, 0, 0];
		this.x = x;
		this.y = y;
		this.z = z;
		this.yaw = 0;
		this.pitch = 0;

		//if (this.world.game.options.startWithEquipment) {
		setTimeout(() => {
			this.getGoodStuff();
		});
		//}

		this.remainingAirActions = this.maxAirActions;
		this.justJumped = false;
	}

	constructor(
		world: World,
	) {
		super(world, 0, 0, 0);
		this.inventory = new Inventory(10);
		this.equipment = new Inventory(2);
		this.equipment.mayPut = (index: number, item: Item): boolean => {
			switch (index) {
				case 0:
					return item.isWeapon;
				default:
					return false;
			}
		};
		this.init();
	}

	/* Damage a character by a certain value, will change in the future to take a Damage argument instead */
	damage(rawAmount: number) {
		this.health = Math.min(
			this.maxHealth,
			Math.max(0, this.health - rawAmount),
		);
		if (this.health <= 0) {
			if (!this.isDead) {
				this.isDead = true;
				this.onDeath();
			}
		}
	}

	/* Heal a character by a certain amount of hit points */
	heal(rawAmount: number) {
		this.damage(-rawAmount);
	}

	dash() {
		if (this.mayJump() || this.remainingAirActions > 0) {
			if (!this.mayJump()) {
				this.remainingAirActions--;
			}
			this.isSprinting = true;
			this.mayDash = false;
			const dashSpeed = 0.75;
			this.world.game.render.particle.fxDash(this.x, this.y - 0.5, this.z);
			const vx = Math.cos(-this.yaw - Math.PI / 2) * dashSpeed;
			const vz = Math.sin(-this.yaw - Math.PI / 2) * dashSpeed;
			this.vx = vx;
			this.vz = vz;
		}
	}

	/* Walk/Run according to the direction of the Entity, ignores pitch */
	move(ox: number, oy: number, oz: number) {
		this.inertiaX = this.inertiaX * 0.97 + ox * -0.03;
		this.inertiaZ = this.inertiaZ * 0.97 + oz * -0.03;

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
				if (!this.mayJump()) {
					this.remainingAirActions--;
				}
				this.vy = 0.2;
				this.jumpStart = this.world.game.ticks;
				this.justJumped = true;
				this.world.game.render.particle.fxJump(this.x, this.y - 0.5, this.z);
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

	isUnderwater(): boolean {
		return this.world.isLiquid(this.x, this.y, this.z);
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

	update() {
		if (this.isDead) {
			return;
		}

		if (this.noClip) {
			this.vx = this.vy = this.vz = 0;
			this.x += this.movementX;
			this.y += this.movementY;
			this.z += this.movementZ;
			return;
		}

		if (!this.isWalking) {
			this.walkAnimationFactor = this.walkAnimationFactor * 0.9;
		} else {
			const p =
				((this.world.game.ticks / (this.isSprinting ? 12 : 24)) & 1) * 2 - 1;
			this.walkAnimationFactor = this.walkAnimationFactor * 0.9 + p * 0.1;
		}

		this.pitch = 0;

		if (!this.world.isLoaded(this.x, this.y, this.z)) {
			return; // Just freeze the character until we have loaded the area, this shouldn't happen if at all possible
		}
		const underwater = this.isUnderwater();

		const movementLength = Math.sqrt(
			this.movementX * this.movementX + this.movementZ * this.movementZ,
		);
		this.walkCycleCounter += Math.min(0.2, movementLength);
		if (this.walkCycleCounter > this.nextStepSound && this.mayJump()) {
			this.nextStepSound = this.walkCycleCounter + 6;
			this.world.game.audio.play("step", 0.5);
		}
		let speed = 0.6;
		let accel =
			movementLength > 0.01 ? CHARACTER_ACCELERATION : CHARACTER_STOP_RATE;

		if (!this.mayJump()) {
			speed *= 0.8; // Slow down player movement changes during jumps
			accel *= 0.4;
			if (this.jumpStart < 0) {
				this.jumpStart = this.world.game.ticks - 1;
			}
		} else {
			this.jumpStart = -1;
			this.mayDash = true;
			this.remainingAirActions = this.maxAirActions;
		}
		if (underwater) {
			speed *= 0.5; // Slow down player movement while underwater
		}
		if (this.lastAction > this.world.game.ticks) {
			speed *= 0.5;
		}

		this.vx = this.vx * (1.0 - accel) + this.movementX * speed * accel;
		this.vz = this.vz * (1.0 - accel) + this.movementZ * speed * accel;
		this.vy -= underwater ? 0.001 : 0.005;
		const oldVx = this.vx;
		const oldVy = this.vy;
		const oldVz = this.vz;

		// Calculate overall velocity
		const v = this.vx * this.vx + this.vz * this.vz + this.vy * this.vy;
		if (v > 0.075) {
			this.world.game.render.particle.fxTrail(this.x, this.y - 1, this.z, v * 8);
		}

		if (underwater) {
			this.vy *= 0.98;
			this.vx *= 0.99;
			this.vz *= 0.99;
		} else if (this.movementY > 0 && this.mayJump()) {
			this.vy = 0.25;
			this.jumpStart = this.world.game.ticks;
			this.world.game.render.particle.fxJump(this.x, this.y - 0.5, this.z);
		}
		if (this.movementY > 0 && this.maySwim() && Math.abs(this.vy) < 0.07) {
			this.vy = 0.06;
		}

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

		const dx = this.vx - oldVx;
		const dy = this.vy - oldVy;
		const dz = this.vz - oldVz;
		const force = Math.sqrt(dx * dx + dy * dy + dz * dz);
		if (force > 0.2) {
			this.world.game.audio.play("stomp", 0.5);
		}
		if (force > 0.1) {
			const amount = Math.floor(force * 2);
			if (amount > 0) {
				this.damage(amount * amount);
			}
		}

		const len = this.vx * this.vx + this.vz * this.vz + this.vy * this.vy;
		if (len > 8.0) {
			const v = clamp(1.0 - (len - 0.2), 0.0001, 1.0);
			this.vx *= v;
			this.vy *= v;
			this.vz *= v;
		}
		super.update();

		this.x += this.vx;
		this.y += this.vy;
		this.z += this.vz;
	}

	cooldown(ticks: number) {
		this.lastAction = this.world.game.ticks + ticks;
	}

	doDamage(target: Being, damage: number) {
		target.damage(damage);
		target.onAttack(this);
	}

	attack(radius = 1.6, damageCB?: (e: Entity) => void): boolean {
		const [vx, vy, vz] = this.direction(0, 0, radius * -0.6);
		const x = this.x + vx;
		const y = this.y + vy;
		const z = this.z + vz;
		let hit = false;
		const rr = radius * radius;
		const weapon = this.equipmentWeapon();
		for (const e of this.world.entities) {
			if (e === this || e instanceof ItemDrop) {
				continue;
			}
			const dx = e.x - x;
			const dy = e.y - y;
			const dz = e.z - z;
			const dd = dx * dx + dy * dy + dz * dz;
			if (dd < rr) {
				hit = true;
				if (damageCB) {
					damageCB(e);
				} else {
					const dm = Math.max(Math.abs(dx), Math.abs(dz));
					const ndx = dx / dm;
					const ndz = dz / dm;
					e.vx += ndx * 0.03;
					e.vy += 0.02;
					e.vz += ndz * 0.03;
					if (e instanceof Being) {
						this.doDamage(e, weapon?.attackDamage(e) || 1);
					}
					this.world.game.render.particle.fxStrike(e.x, e.y, e.z);
				}
			}
		}

		const br = radius * 0.4;
		for (let cx = Math.floor(x - br); cx < Math.ceil(x + br); cx++) {
			for (
				let cy = Math.floor(y - br - 0.5);
				cy < Math.ceil(y + br - 0.5);
				cy++
			) {
				for (let cz = Math.floor(z - br); cz < Math.ceil(z + br); cz++) {
					const b = this.world.getBlock(cx, cy, cz);
					if (b) {
						const bt = this.world.blocks[b];
						if (bt.health < 200) {
							this.world.setBlock(cx, cy, cz, 0);
							this.world.game.render.particle.fxBlockBreak(cx, cy, cz, bt);
						}
					}
				}
			}
		}

		const srr = (radius + 0.4) * (radius + 0.4);
		for (let cxo = -1; cxo < 2; cxo++) {
			for (let cyo = -1; cyo < 2; cyo++) {
				for (let czo = -1; czo < 2; czo++) {
					const cx = x + cxo * 32;
					const cy = y + cyo * 32;
					const cz = z + czo * 32;
					const c = this.world.getChunk(cx, cy, cz);
					if (!c) {
						continue;
					}
					for (const s of c.static) {
						const dx = x - s.x;
						const dy = y - s.y;
						const dz = z - s.z;
						const dd = dx * dx + dy * dy + dz * dz;
						if (dd < srr) {
							s.onAttacked(this);
						}
					}
				}
			}
		}

		return hit;
	}

	/* Callback function that gets called when this Character dies */
	onDeath() {
		this.world.game.audio.play("ungh", 0.2);
		this.world.game.ui.hotbar.clear();
		this.init();
	}

	/* Callback function that gets called whenever this character is attacked */
	onAttack(perpetrator: Entity): void {
		this.world.game.render.canvasWrapper.classList.remove("fx-damage");
		this.world.game.render.canvasWrapper.getBoundingClientRect();
		this.world.game.render.canvasWrapper.classList.add("fx-damage");
		this.world.game.audio.play("ungh", 0.2);
	}

	/* Return true when the character shouldn't be able to do anything */
	isOnCooldown(): boolean {
		return this.world.game.ticks < this.lastAction;
	}

	/* Do a melee attack using whatever item is currently selected */
	strike() {
		if (this.world.game.ticks < this.lastAction) {
			return;
		}
		const item = this.equipmentWeapon();

		this.hitAnimation = this.world.game.render.frames;
		const hit = this.attack(1.8);
		const cooldownDur = item ? item.attackCooldown(this) : 100;
		this.cooldown(cooldownDur);
		if (hit) {
			this.world.game.audio.play("punch");

			if (item) {
				item.onAttackWith(this);
			}
		} else {
			this.world.game.audio.play("punchMiss");
		}
		const px = this.x + Math.cos(-this.yaw - Math.PI / 2);
		const py = this.y - 0.9;
		const pz = this.z + Math.sin(-this.yaw - Math.PI / 2);
		this.world.game.render.particle.fxStrike(px, py, pz);
	}

	equipmentWeapon() {
		return this.equipment.items[0];
	}

	/* Use the current item or punch if we don't have anything equipped */
	primaryAction() {
		const item = this.equipmentWeapon();
		if (item) {
			item.use(this);
		} else {
			this.strike();
		}
	}

	/* Use whatever skill is currently selected */
	secondaryAction() {}

	/* Drop the item in the argument in front of the player */
	dropItem(item: MaybeItem): ItemDrop | null {
		if (item) {
			const drop = ItemDrop.fromItem(item, this);
			this.hitAnimation = this.world.game.render.frames;
			this.inventory.updateAll();
			return drop;
		}
		return null;
	}

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

	calcHeadYaw(cam: Position): number {
		return 0;
	}

	draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Position) {
		this.world.game.render.decals.addShadow(this.x, this.y, this.z, 0.75);
		const dx = this.x - cam.x;
		const dy = this.y - cam.y;
		const dz = this.z - cam.z;
		const d = Math.cbrt(dx * dx + dy * dy + dz * dz);
		const renderDistance = this.world.game.render.renderDistance;
		const alpha = Math.min(1, Math.max(0, renderDistance - d) / 8);

		const headYaw = this.calcHeadYaw(cam);
		let headPitch = this.walkAnimationFactor * 0.025 + cam.pitch * 0.25;
		let bodyPitch = this.walkAnimationFactor * -0.035;
		let leftArmPitch = this.walkAnimationFactor * 0.7;
		let rightArmPitch = this.walkAnimationFactor * -0.7;
		let rightLegPitch = this.walkAnimationFactor * 0.6;
		let leftLegPitch = this.walkAnimationFactor * -0.6;

		if (this.hitAnimation + 100 > this.world.game.render.frames) {
			const t = this.hitAnimation + 100 - this.world.game.render.frames;
			rightArmPitch = (t / 100) * 1.5;
			rightArmPitch *= rightArmPitch;
			leftArmPitch = rightArmPitch * -0.5;

			leftLegPitch += rightArmPitch * 0.1;
			rightLegPitch += rightArmPitch * -0.1;
			headPitch += rightArmPitch * 0.15;
		}

		const {
			playerHead,
			playerTorso,
			playerLeftArm,
			playerLeftLeg,
			playerRightArm,
			playerRightLeg,
		} = this.world.game.render.assets;
		this.updateYStretch();
		const yStretch = this.yStretch;

		this.drawBodyPart(
			projectionMatrix,
			viewMatrix,
			alpha,
			0,
			-0.175 * yStretch,
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
			-0.95 * yStretch,
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
			-0.625 * yStretch,
			0,
			0,
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
			-0.625 * yStretch,
			0,
			0,
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
			-1.35 * yStretch,
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
			-1.35 * yStretch,
			0,
			0,
			leftLegPitch,
			playerLeftLeg,
			0,
			-0.2,
			0,
		);
	}

	mesh(): VoxelMesh {
		return this.world.game.render.assets.playerHead;
	}
}
