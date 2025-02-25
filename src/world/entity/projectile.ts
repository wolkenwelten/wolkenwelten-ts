/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { TriangleMesh } from "../../render/meshes/triangleMesh/triangleMesh";
import type { VoxelMesh } from "../../render/meshes/voxelMesh/voxelMesh";
import { Mob } from "./mob";
import { Entity } from "./entity";

export class Projectile extends Entity {
	weight = 1;
	source: Entity;
	projectileMesh: TriangleMesh | VoxelMesh | null;
	ttl = 128;
	noClip = false;
	onHit?: (e: Entity) => void;
	onMiss?: () => void;
	onUpdate?: () => void;

	constructor(source: Entity, speed: number) {
		super(source.world);
		this.source = source;

		this.x = source.x;
		this.y = source.y;
		this.z = source.z;
		this.yaw = source.yaw;
		this.pitch = source.pitch;
		const [vx, vy, vz] = source.direction(0, 0, -1, speed * 0.5);

		this.vx = vx;
		this.vy = vy;
		this.vz = vz;

		this.projectileMesh = null;
	}

	mesh(): TriangleMesh | VoxelMesh | null {
		return this.projectileMesh;
	}

	private checkForEntityCollisions() {
		for (const e of this.world.entities) {
			if (e === this || e === this.source || e.destroyed) {
				continue;
			}
			if (!(e instanceof Mob)) {
				continue;
			}
			const dx = e.x - this.x;
			const dy = e.y - this.y - 0.5;
			const dz = e.z - this.z;
			const dd = dx * dx + dy * dy * 0.5 + dz * dz;
			if (dd <= 0.5) {
				this.onHit && this.onHit(e);
				this.destroy();
				return;
			}
		}
	}

	update() {
		if (this.destroyed) {
			return;
		}
		if (--this.ttl < 0) {
			this.destroy();
		}
		super.update();
		this.checkForEntityCollisions();
		this.onUpdate && this.onUpdate();
		if (!this.noClip && this.collides()) {
			this.onMiss && this.onMiss();
			this.destroy();
		}
	}
}
