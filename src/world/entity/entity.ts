/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";

import type { TriangleMesh } from "../../client/render/meshes/triangleMesh/triangleMesh";
import type { VoxelMesh } from "../../client/render/meshes/voxelMesh/voxelMesh";
import { type World } from "../world";
import type { Position } from "../../util/math";
import { GRAVITY } from "../../constants";

let entityCounter = 0;
const modelViewMatrix = mat4.create();
const transPos = new Float32Array([0, 0, 0]);

const registeredEntities = new Map<string, new (world: World) => Entity>();

export const registerEntity = (
	T: string,
	constructor: new (world: World) => Entity,
) => {
	Entity.registeredEntities.set(T, constructor);
};

export class Entity {
	static readonly registeredEntities = registeredEntities;

	id: number;
	T = "Entity";

	x = 0;
	y = 0;
	z = 0;
	vx = 0;
	vy = 0;
	vz = 0;

	yaw = 0;
	pitch = 0;

	noClip = false;
	destroyed = false;
	world: World;
	weight = 1; // Necessary for physics calculations
	scale = 1;

	constructor(world: World) {
		this.id = ++entityCounter;
		this.world = world;
		world.addEntity(this);
	}

	static deserialize(world: World, data: any) {
		const constructor = registeredEntities.get(data.T);
		if (!constructor) {
			throw new Error(`Unknown entity type: ${data.T}`);
		}
		const entity = new constructor(world);
		entity.deserialize(data);
		return entity;
	}

	serialize() {
		return {
			id: this.id,
			T: this.T,

			x: this.x,
			y: this.y,
			z: this.z,
			vx: this.vx,
			vy: this.vy,
			vz: this.vz,
			yaw: this.yaw,
			pitch: this.pitch,
			scale: this.scale,

			noClip: this.noClip,
			destroyed: this.destroyed,
		};
	}

	deserialize(data: any) {
		this.x = data.x;
		this.y = data.y;
		this.z = data.z;
		this.vx = data.vx;
		this.vy = data.vy;
		this.vz = data.vz;
		this.yaw = data.yaw;
		this.pitch = data.pitch;
		this.scale = data.scale;
		this.noClip = data.noClip;
		this.destroyed = data.destroyed;
	}

	startAnimation(_animation = 0) {}

	cooldown(ticks: number) {}

	destroy() {
		this.destroyed = true;
		this.world.removeEntity(this);
	}

	mayJump(): boolean {
		return this.world.isSolid(this.x, this.y - 1.7, this.z);
	}

	getSpeed(): number {
		return Math.cbrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
	}

	walkDirection(): [number, number] {
		const x = Math.sin(this.yaw);
		const z = Math.cos(this.yaw);
		return [x, z];
	}

	/* Walk/Run according to the direction of the Entity, ignores pitch */
	move(ox: number, oy: number, oz: number) {
		const nox = ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw);
		const noz = ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw);
		this.x += nox;
		this.z += noz;
		this.y += oy;
	}

	/* Fly into the direction the Entity is facing */
	fly(ox: number, oy: number, oz: number) {
		const [nox, noy, noz] = this.direction(ox, oy, oz);
		this.x += nox;
		this.y += noy;
		this.z += noz;
	}

	rotate(yaw: number, pitch: number) {
		this.yaw += yaw;
		this.pitch += pitch;
	}

	collides() {
		return (
			this.world.isSolid(this.x, this.y + 0.3, this.z) ||
			this.world.isSolid(this.x, this.y, this.z) ||
			this.world.isSolid(this.x, this.y - 0.3, this.z)
		);
	}

	getVelocity() {
		return Math.cbrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
	}

	onDeath() {}
	onAttack(perpetrator: Entity) {}
	damage(rawAmount: number) {}
	heal(rawAmount: number) {}

	update() {
		if (
			this.noClip ||
			this.destroyed ||
			!this.world.isLoaded(this.x, this.y, this.z)
		) {
			return;
		}

		this.x += this.vx;
		this.y += this.vy;
		this.z += this.vz;
		this.vy -= GRAVITY;

		if (this.collides()) {
			this.vy = 0;
			this.vx = 0;
			this.vz = 0;
		}
	}

	/* Get a velocity vector for the direction the Entity is facing */
	direction(
		ox = 0,
		oy = 0,
		oz = 1,
		vel = 1,
		pitchDelta = 0,
	): [number, number, number] {
		const pitch = this.pitch + pitchDelta;
		const nox =
			(ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw)) * Math.cos(-pitch);
		const noy = oy + oz * Math.sin(-pitch);
		const noz =
			(ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw)) * Math.cos(-pitch);
		return [nox * vel, noy * vel, noz * vel];
	}

	dircast(range: number, maxYOffset = 4): [number, number, number] {
		const [dx, dy, dz] = this.direction(0, 0, -1, 1.0 / 4.0);
		let x = this.x;
		let y = this.y;
		let z = this.z;

		x = Math.floor(x + dx * range * 4);
		y = Math.floor(y + dy * range * 4);
		z = Math.floor(z + dz * range * 4);

		for (let yOff = maxYOffset - 1; yOff > -maxYOffset; yOff--) {
			if (this.world.isSolid(x, y + yOff, z)) {
				return [x, y + yOff, z];
			}
		}
		return [x, y, z];
	}

	/* Cast a ray into the direction the Entity is facing and return the world coordinates of either the block, or
	 * the location immediatly in front of the block (useful when placing blocks)
	 */
	raycast(
		returnFront = false,
		pitchDelta = 0,
		maxSteps = 1024,
	): [number, number, number] | null {
		const [dx, dy, dz] = this.direction(0, 0, -1, 0.0625, pitchDelta);
		let x = this.x;
		let y = this.y;
		let z = this.z;
		let lastX = Math.floor(this.x);
		let lastY = Math.floor(this.y);
		let lastZ = Math.floor(this.z);
		if (this.world.isSolid(lastX, lastY, lastZ)) {
			return [lastX, lastY, lastZ];
		}

		for (let i = 0; i < maxSteps; i++) {
			const ix = Math.floor(x);
			const iy = Math.floor(y);
			const iz = Math.floor(z);
			if (ix != lastX || iy != lastY || iz != lastZ) {
				if (this.world.isSolid(ix, iy, iz)) {
					return returnFront ? [lastX, lastY, lastZ] : [ix, iy, iz];
				}
				lastX = ix;
				lastY = iy;
				lastZ = iz;
			}
			x += dx;
			y += dy;
			z += dz;
		}
		return null;
	}

	/* Step into the direction the entity is facing and call cb for every block until cb returns false */
	stepIntoDirection(cb: (x: number, y: number, z: number) => boolean) {
		const [dx, dy, dz] = this.direction(0, 0, -1, 0.0625);
		let x = this.x;
		let y = this.y;
		let z = this.z;
		let lastX = Math.floor(this.x);
		let lastY = Math.floor(this.y);
		let lastZ = Math.floor(this.z);

		for (let i = 0; i < 1024; i++) {
			const ix = Math.floor(x);
			const iy = Math.floor(y);
			const iz = Math.floor(z);
			if (ix != lastX || iy != lastY || iz != lastZ) {
				lastX = ix;
				lastY = iy;
				lastZ = iz;
				if (!cb(ix, iy, iz)) {
					return;
				}
			}
			x += dx;
			y += dy;
			z += dz;
		}
		return;
	}

	mesh(): TriangleMesh | VoxelMesh | null {
		return this.world.game.render?.assets.bag || null;
	}

	draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Position) {
		if (this.destroyed || !this.world.game.render) {
			return;
		}
		const mesh = this.mesh();
		if (!mesh) {
			return;
		}
		this.world.game.render?.decals.addShadow(this.x, this.y, this.z, 1);

		transPos[0] = this.x;
		transPos[1] = this.y;
		transPos[2] = this.z;
		mat4.identity(modelViewMatrix);
		mat4.translate(modelViewMatrix, modelViewMatrix, transPos);
		if (this.scale != 1) {
			transPos[0] = this.scale;
			transPos[1] = this.scale;
			transPos[2] = this.scale;
			mat4.scale(modelViewMatrix, modelViewMatrix, transPos);
		}
		mat4.rotateY(modelViewMatrix, modelViewMatrix, this.yaw);
		mat4.mul(modelViewMatrix, viewMatrix, modelViewMatrix);
		mat4.mul(modelViewMatrix, projectionMatrix, modelViewMatrix);
		const dx = this.x - cam.x;
		const dy = this.y - cam.y;
		const dz = this.z - cam.z;
		const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
		const renderDistance = this.world.game.render?.renderDistance || 0;
		const alpha = Math.min(1, Math.max(0, renderDistance - d) / 8);
		mesh.draw(modelViewMatrix, alpha);
	}

	beRepelledByEntities() {
		if ((this.id & 0xf) !== (this.world.game.ticks & 0xf)) {
			return;
		}
		for (const e of this.world.entities.values()) {
			if (e === this) {
				continue;
			}
			const dx = e.x - this.x;
			const dy = e.y - this.y;
			const dz = e.z - this.z;
			const dd = dx * dx + dy * dy * 0.5 + dz * dz;
			if (dd < 1.8) {
				const w = Math.max(0.98, Math.min(0.999, this.weight / e.weight));
				this.vx = this.vx * w + (dx < 0 ? 1.35 : -1.35 - dx) * (1.0 - w);
				this.vz = this.vz * w + (dz < 0 ? 1.35 : -1.35 - dz) * (1.0 - w);
			}
		}
	}

	playSound(name: string, volume = 1.0, stopWhenEntityDestroyed = false) {
		this.world.game.audio?.playFromEntity(
			name,
			volume,
			this,
			stopWhenEntityDestroyed,
		);
	}

	playUnmovingSound(name: string, volume = 1.0) {
		this.world.game.audio?.playAtPosition(name, volume, [
			this.x,
			this.y,
			this.z,
		]);
	}
}
registerEntity("Entity", Entity);
