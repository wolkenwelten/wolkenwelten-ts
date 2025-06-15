/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * NetworkObjects are the base class for all objects that are synced over the network.
 * This is the base class for all entities that are synced over the network.
 * You can extend it for sharing state between nodes.
 *
 * If this objects has a physics component, you should extend the Entity class instead.
 *
 */
import { type World } from "../world";

let idCounter = 0;

export const setIdCounter = (counter: number) => {
	idCounter = counter;
};

const registeredNetworkObjects = new Map<
	string,
	new (
		world: World,
		id?: number,
	) => NetworkObject
>();

export const registerNetworkObject = (
	T: string,
	constructor: new (world: World, id?: number) => NetworkObject,
) => {
	NetworkObject.registeredNetworkObjects.set(T, constructor);
};

export abstract class NetworkObject {
	static readonly registeredNetworkObjects = registeredNetworkObjects;

	// Track entities whose ownership has changed and need a final update sent
	static pendingOwnershipChanges: NetworkObject[] = [];

	id: number;
	ownerID: number;
	T = "NetworkObject";
	destroyed = false;
	world: World;

	constructor(world: World, id = 0) {
		this.id = id || ++idCounter;
		this.ownerID = world.game.networkID;
		this.world = world;
		world.addNetworkObject(this);
	}

	static update(world: World) {
		// Defaults to nothing
	}

	static staticUpdate(world: World) {
		for (const c of registeredNetworkObjects.values()) {
			(c as any).update(world);
		}
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
		const constructor = registeredNetworkObjects.get(data.T);
		if (!constructor) {
			throw new Error(`Unknown network object type: ${data.T}`);
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
		this.destroyed = data.destroyed;
	}

	destroy() {
		this.destroyed = true;
		this.world.removeNetworkObject(this);
		NetworkObject.pendingOwnershipChanges.push(this);
	}

	/**
	 * Main per-tick simulation. Called once per world tick.
	 */
	update() {
		// Empty, we don't need to update network objects
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
		if (!NetworkObject.pendingOwnershipChanges.includes(this)) {
			NetworkObject.pendingOwnershipChanges.push(this);
		}
	}
}
