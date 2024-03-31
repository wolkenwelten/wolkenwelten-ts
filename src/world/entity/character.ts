/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";

import type { TriangleMesh } from "../../render/meshes/triangleMesh/triangleMesh";
import type { VoxelMesh } from "../../render/meshes/voxelMesh/voxelMesh";
import type { Entity } from "./entity";
import type { World } from "../world";
import { Being } from "./being";
import { ItemDrop } from "./itemDrop";
import { Inventory } from "../item/inventory";
import { Item, MaybeItem } from "../item/item";

const CHARACTER_ACCELERATION = 0.05;
const CHARACTER_STOP_RATE = CHARACTER_ACCELERATION * 3.0;

const transPos = new Float32Array([0, 0, 0]);
const modelViewMatrix = mat4.create();

const clamp = (x: number, min: number, max: number) =>
	Math.min(Math.max(x, min), max);

export class Character extends Being {
	spawnX: number;
	spawnY: number;
	spawnZ: number;
	spawnYaw: number;
	spawnPitch: number;

	movementX = 0;
	movementY = 0;
	movementZ = 0;
	lastAction = 0;
	miningCooldownUntil = 0;
	hitAnimation = -100;
	walkCycleCounter = 0;
	nextStepSound = 0;

	jumpAnimeFactor = 0;
	inertiaX = 0;
	inertiaZ = 0;

	health = 24;
	maxHealth = 24;
	isDead = false;

	weight = 70;

	equipment: Inventory;
	inventory: Inventory;

	/* Simple cheat, can be run from the browser console by typing `wolkenwelten.player.getGoodStuff();` */
	getGoodStuff() {
		this.inventory.add(Item.create("earthBullet", this.world));
		this.inventory.add(Item.create("earthWall", this.world));
		this.inventory.add(Item.create("fireBreath", this.world));
		this.inventory.add(Item.create("comet", this.world));
		this.inventory.add(Item.create("stone", this.world, 50));

		//this.equipment.items[0] = Item.create('club', this.world);
	}

	/* Initialize an already existing Character, that way we can easily reuse the same object, */
	init() {
		this.x = this.spawnX;
		this.y = this.spawnY;
		this.z = this.spawnZ;
		this.yaw = this.spawnYaw;
		this.pitch = this.spawnPitch;
		this.noClip = false;
		this.isDead = false;
		this.maxHealth = this.health = 24;
		this.hitAnimation = -100;
		this.lastAction = 0;
		this.vx = this.vy = this.vz = 0;

		this?.world?.game?.render?.camera?.stop();
		this.effects.clear();
		this.inventory.clear();
		this.equipment.clear();
		this.inventory.select(0);
		//if (this.world.game.options.startWithEquipment) {
		setTimeout(() => {
			this.getGoodStuff();
		});
		//}
	}

	constructor(
		world: World,
		x: number,
		y: number,
		z: number,
		yaw: number,
		pitch: number,
	) {
		super(world, x, y, z);
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
		this.spawnX = this.x = x;
		this.spawnY = this.y = y;
		this.spawnZ = this.z = z;
		this.spawnYaw = this.yaw = yaw;
		this.spawnPitch = this.pitch = pitch;
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

	/* Walk/Run according to the direction of the Entity, ignores pitch */
	move(ox: number, oy: number, oz: number) {
		this.inertiaX = this.inertiaX * 0.97 + ox * -0.03;
		this.inertiaZ = this.inertiaZ * 0.97 + oz * -0.03;

		if (ox === 0 && oz === 0) {
			this.movementX = this.movementZ = 0;
		} else {
			if (oz > 0) {
				oz *= 0.5; // Slow down backwards movement
			}
			ox *= 0.75; // Slow down strafing somewhat
			this.movementX = ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw);
			this.movementZ = ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw);
		}
		this.movementY = oy > 0 ? 1 : 0;
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
		let speed = 0.4;
		let accel =
			movementLength > 0.01 ? CHARACTER_ACCELERATION : CHARACTER_STOP_RATE;

		if (!this.mayJump()) {
			speed *= 0.8; // Slow down player movement changes during jumps
			accel *= 0.4;
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

		this.jumpAnimeFactor = Math.max(0, this.jumpAnimeFactor * 0.97);

		if (underwater) {
			this.vy *= 0.98;
			this.vx *= 0.99;
			this.vz *= 0.99;
		} else if (this.movementY > 0 && this.mayJump()) {
			this.vy = 0.15;
			//this.world.game.render.particle.fxJump(this.x, this.y - 0.5, this.z);
			this.jumpAnimeFactor = 1;
		}
		if (this.movementY > 0 && this.maySwim() && Math.abs(this.vy) < 0.07) {
			this.vy = 0.06;
			this.jumpAnimeFactor = 0.5;
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
		this.miningCooldownUntil = this.world.game.ticks + 10;
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
		const hit = this.attack();
		const cooldownDur = item ? item.attackCooldown(this) : 80;
		this.cooldown(cooldownDur);
		if (hit) {
			this.world.game.audio.play("punch");
			this.miningCooldownUntil = this.world.game.ticks + cooldownDur;

			if (item) {
				item.onAttackWith(this);
			}
		} else {
			this.world.game.audio.play("punchMiss");
		}
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

	/* Since right now WW is only singleplayer we can ignore this method */
	draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
		this.world.game.render.decals.addShadow(this.x, this.y, this.z, 1);

		mat4.identity(modelViewMatrix);
		transPos[0] = this.x;
		transPos[1] = this.y;
		transPos[2] = this.z;
		mat4.translate(modelViewMatrix, modelViewMatrix, transPos);

		mat4.rotateY(modelViewMatrix, modelViewMatrix, this.yaw);
		mat4.rotateX(modelViewMatrix, modelViewMatrix, this.pitch);
		mat4.mul(modelViewMatrix, viewMatrix, modelViewMatrix);
		mat4.mul(modelViewMatrix, projectionMatrix, modelViewMatrix);
		const dx = this.x - cam.x;
		const dy = this.y - cam.y;
		const dz = this.z - cam.z;
		const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
		const renderDistance = this.world.game.render.renderDistance;
		const alpha = Math.min(1, Math.max(0, renderDistance - d) / 8);
		this.mesh().draw(modelViewMatrix, alpha);
	}

	mesh(): VoxelMesh {
		return this.world.game.render.assets.player;
	}
}
