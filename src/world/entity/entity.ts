/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Entity – The fundamental building block of everything that can exist inside the
 * Wolkenwelten world.
 *
 * Every interactive or visible 3-D object (players, mobs, items, particles,
 * projectiles, vehicles, etc.) MUST extend this class.  Doing so grants the new
 * class:
 *
 *  • Automatic registration/instantiation over the network via
 *    `Entity.deserialize` and the `registerEntity()` helper.
 *  • Position, orientation (yaw/pitch), scale, velocity and basic gravity-based
 *    physics handled in `update()`.
 *  • Collision helpers (`collides`, `raycast`, `dircast`, …) and convenience
 *    methods for world interaction (`move`, `fly`, `direction`, …).
 *  • Owner tracking that allows authority hand-off between server and client –
 *    see `changeOwner()`.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * Extending Entity
 * ──────────────────────────────────────────────────────────────────────────────
 * 1. Create a subclass and call `registerEntity("MyType", MyClass)` **once**.
 * 2. Add your custom fields.
 * 3. Override `serialize()` and `deserialize()` **but always** chain to the
 *    super implementation and extend the resulting object.  If you do this the
 *    networking layer will seamlessly replicate your entity.
 * 4. Override `update()` if you need per-tick behaviour.  Call `super.update()`
 *    first if you still want gravity/collision.
 *
 * 💡 Tip: Look at other entities in the codebase for concise examples.
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

export const setEntityCounter = (counter: number) => {
	entityCounter = counter;
};

const registeredEntities = new Map<
	string,
	new (
		world: World,
		id?: number,
	) => Entity
>();

export const registerEntity = (
	T: string,
	constructor: new (world: World, id?: number) => Entity,
) => {
	Entity.registeredEntities.set(T, constructor);
};

export class Entity {
	static readonly registeredEntities = registeredEntities;

	// Track entities whose ownership has changed and need a final update sent
	static pendingOwnershipChanges: Entity[] = [];

	id: number;
	ownerID: number;
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

	constructor(world: World, id = 0) {
		this.id = id || ++entityCounter;
		this.ownerID = world.game.networkID;
		this.world = world;
		world.addEntity(this);
	}

	/**
	 * Reconstruct an Entity (or one of its subclasses) from raw network/save
	 * data.  The function looks up the correct constructor in
	 * `registeredEntities`, creates the instance and forwards the data to its
	 * own `deserialize()` implementation.
	 *
	 * ⚠️  Throws when the entity type is unknown – make sure your subclass is
	 *     registered via `registerEntity()` **before** any packets arrive.
	 */
	static deserialize(world: World, data: any) {
		const constructor = registeredEntities.get(data.T);
		if (!constructor) {
			throw new Error(`Unknown entity type: ${data.T}`);
		}
		const entity = new constructor(world, data.id);
		entity.deserialize(data);
		return entity;
	}

	/**
	 * Package all entity state required for the client/server to reconstruct
	 * this instance.  Subclasses **must** call `super.serialize()` and then merge
	 * their additional fields, e.g.
	 *
	 * ```ts
	 * const base = super.serialize();
	 * return { ...base, myCustomField };
	 * ```
	 */
	serialize() {
		return {
			id: this.id,
			ownerID: this.ownerID,
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

	/**
	 * Apply the data produced by `serialize()` onto the current instance.
	 * Subclasses should call `super.deserialize(data)` first and then extract
	 * their own custom fields.
	 */
	deserialize(data: any) {
		this.id = data.id;
		this.ownerID = data.ownerID;
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

	/**
	 * Main per-tick simulation.  The default implementation applies velocity,
	 * gravity and very rudimentary collision/stop handling.
	 *
	 * Override this method to implement entity specific behaviour but remember
	 * to call `super.update()` first if you still want the default physics.
	 */
	update() {
		if (
			this.noClip ||
			this.destroyed ||
			this.ownerID !== this.world.game.networkID ||
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

	/**
	 * Convert a local offset (ox, oy, oz) into a world-space vector that points
	 * in the direction the entity is currently facing (yaw/pitch).  Useful for
	 * projectiles, movement or ray-casting.
	 *
	 * `vel` scales the final vector, `pitchDelta` lets callers temporarily adjust
	 * the vertical angle (e.g. throw arcs) without modifying `this.pitch`.
	 */
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

	/**
	 * Casts a ray **from** the entity **into the direction it faces** and
	 * returns the first solid block hit – or, when `returnFront === true`, the
	 * coordinate right in *front* of that block (handy for placing blocks).
	 * Returns `null` if nothing was found within `maxSteps` steps.
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
		if ((this.id & 0x7) !== (this.world.game.ticks & 0x7)) {
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
			if (dd < 0.6) {
				const w = Math.max(0.9, Math.min(0.95, this.weight / e.weight));
				this.vx += (dx < 0 ? 1.5 : -1.5) * (1.0 - w);
				this.vz += (dz < 0 ? 1.5 : -1.5) * (1.0 - w);
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

	isUnderwater(): boolean {
		return this.world.isLiquid(this.x, this.y, this.z);
	}

	isInLoadingChunk(): boolean {
		const chunk = this.world.getChunk(this.x, this.y, this.z);
		return chunk?.loaded === false;
	}

	/**
	 * Transfer simulation ownership of this entity to another network peer.
	 *
	 * Client ↠ Server:  only allowed to hand authority back to the server
	 *                   (`newOwnerID === 0`).
	 * Server ↠ Client:  only allowed to give authority to a *different* client
	 *                   (`newOwnerID !== 0 && newOwnerID !== this.ownerID`).
	 *
	 * Violating these rules throws to guard against desyncs.
	 * After a successful change the entity is queued in
	 * `Entity.pendingOwnershipChanges` so the networking layer can send one last
	 * authoritative update.
	 */
	changeOwner(newOwnerID: number) {
		const isClient = this.world.game.isClient;
		const isServer = this.world.game.isServer;
		if (isClient) {
			if (newOwnerID !== 0) {
				throw new Error(
					"(｡•́︿•̀｡) Client can only transfer ownership to the server (ownerID 0)!",
				);
			}
		} else if (isServer) {
			if (newOwnerID === this.ownerID || newOwnerID === 0) {
				throw new Error(
					"(╬ Ò﹏Ó) Server can only transfer ownership to a different client!",
				);
			}
		} else {
			throw new Error(
				"(⊙_⊙;) Unknown execution context for ownership transfer!",
			);
		}
		this.ownerID = newOwnerID;
		// Add to pendingOwnershipChanges for networking code to send a final update
		if (!Entity.pendingOwnershipChanges.includes(this)) {
			Entity.pendingOwnershipChanges.push(this);
		}
	}
}
registerEntity("Entity", Entity);
