/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * WorldRenderer translates the logical voxel world into GPU-friendly meshes and
 * issues all draw calls for chunks as well as world-space entities. It owns two
 * major data structures:
 *  • `meshes` – the live cache of `BlockMesh` instances, one per chunk key.
 *  • `generatorQueue` – a priority queue (sorted far → near) of chunks that
 *    still need mesh generation or an update.
 *
 * Responsibilities
 * ---------------
 * 1. Generate or update chunk meshes on demand via `generateOneQueuedMesh()` so
 *    the main render loop stays responsive.
 * 2. Frustum-cull chunks every frame and sort them back-to-front for correct
 *    alpha blending (solids first, then semi-transparent faces).
 * 3. Delegate entity drawing; `WorldRenderer` does **not** store entity state
 *    itself.
 *
 * Extending WorldRenderer
 * -----------------------
 * • Keep heavy CPU work out of `draw()`; instead enqueue it in the generator
 *   queue so it can be processed across multiple frames.
 * • When adding a new mesh type remember to update the two-pass draw order
 *   (opaque then transparent) or visual glitches will occur.
 *
 * Pitfalls & footguns
 * -------------------
 * • The generator queue is processed from the **end** (pop). Always sort it
 *   after pushing new entries.
 * • `calcMask()` encodes the viewer-to-chunk relation as a 6-bit mask and must
 *   stay in sync with the shader logic inside `BlockMesh.drawFast()`.
 * • If you forget to call `BlockMesh.bindShaderAndTexture()` before drawing, the
 *   GPU will sample stale textures.
 */
import { mat4 } from "gl-matrix";

import type { RenderManager } from "./render";
import type { Position } from "../../util/math";
import { coordinateToWorldKey } from "../../world/world";
import { Frustum } from "./frustum";
import { BlockMesh } from "./meshes/blockMesh/blockMesh";
import { VoxelMesh } from "./meshes/voxelMesh/voxelMesh";

type GeneratorQueueEntry = {
	dd: number;
	x: number;
	y: number;
	z: number;
};

type DrawQueueEntry = {
	mesh: BlockMesh;
	dd: number;
	mask: number;
	alpha: number;
};

export class WorldRenderer {
	meshes: Map<number, BlockMesh> = new Map();
	staticMeshes: Map<number, VoxelMesh> = new Map();
	renderer: RenderManager;
	generatorQueue: GeneratorQueueEntry[] = [];
	drawQueue: DrawQueueEntry[] = [];
	frustum = new Frustum();
	chunksDrawn = 0;
	chunksSkipped = 0;

	mvp = mat4.create();

	constructor(renderer: RenderManager) {
		this.renderer = renderer;
	}

	/**
	 * Generates or refreshes the mesh for one queued chunk. Intended to be called
	 * repeatedly from `RenderManager.generateMesh()` until the queue is empty.
	 */
	generateOneQueuedMesh() {
		const entry = this.generatorQueue.pop();
		if (!entry) {
			return;
		}
		const { x, y, z } = entry;

		const chunk = this.renderer.game.world.getOrGenChunk(x, y, z);
		if (!chunk.loaded) {
			return;
		}
		const oldMesh = this.getMesh(x, y, z);
		if (!oldMesh) {
			const newMesh = BlockMesh.fromChunk(chunk);
			const key = coordinateToWorldKey(x, y, z);
			this.meshes.set(key, newMesh);
		} else {
			oldMesh.updateFromChunk(chunk);
		}
	}

	/**
	 * Quick heuristic to decide whether the head of the generator queue is too
	 * far from the player to bother processing right now. Helps keep nearby
	 * chunks crisp by delaying far-away work.
	 */
	queueEntryIsFarAway(): boolean {
		const entry = this.generatorQueue[this.generatorQueue.length - 1];
		if (!entry) {
			return true;
		}
		if (!this.renderer.game.player) {
			return true;
		}
		const player = this.renderer.game.player;
		const { x, y, z } = entry;
		const dmax = Math.min(
			Math.abs(x - player.x),
			Math.abs(y - player.y),
			Math.abs(z - player.z),
		);
		return dmax > 24;
	}

	getMesh(x: number, y: number, z: number): BlockMesh | undefined {
		const key = coordinateToWorldKey(x, y, z);
		const ret = this.meshes.get(key);
		return ret;
	}

	/**
	 * Encodes which of the six cardinal directions the camera is outside of a
	 * chunk. Used by the shader to skip drawing faces that can never be seen.
	 */
	calcMask(x: number, y: number, z: number): number {
		return (
			+(z <= 0) |
			(+(z >= 0) << 1) |
			(+(y <= 0) << 2) |
			(+(y >= 0) << 3) |
			(+(x >= 0) << 4) |
			(+(x <= 0) << 5)
		);
	}

	/**
	 * Main draw pass for all chunks and world entities. Performs:
	 *  1. Frustum culling
	 *  2. Draw-queue assembly & distance sorting
	 *  3. Two-pass render (opaque, then alpha faces)
	 *  4. Enqueues outdated or missing meshes for regeneration
	 */
	draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Position) {
		const cx = cam.x & ~31;
		const cy = cam.y & ~31;
		const cz = cam.z & ~31;
		const frustum = this.frustum;
		frustum.build(projectionMatrix, viewMatrix);
		for (const entity of this.renderer.game.world.entities.values()) {
			entity.draw(projectionMatrix, viewMatrix, cam);
		}
		BlockMesh.bindShaderAndTexture(
			projectionMatrix,
			viewMatrix,
			this.renderer.renderDistance,
		);

		let drawn = 0;
		let skipped = 0;

		this.generatorQueue.length = 0;
		let drawQLen = 0;
		this.drawQueue.length = 0;
		const ticks = this.renderer.game.ticks;
		const RENDER_STEPS = Math.ceil(this.renderer.renderDistance / 32);
		for (let x = -RENDER_STEPS; x <= RENDER_STEPS; x++) {
			for (let y = -RENDER_STEPS; y <= RENDER_STEPS; y++) {
				for (let z = -RENDER_STEPS; z <= RENDER_STEPS; z++) {
					const nx = cx + x * 32;
					const ny = cy + y * 32;
					const nz = cz + z * 32;
					if (!frustum.containsCube(nx, ny, nz)) {
						skipped++;
						continue;
					}
					drawn++;
					const dx = cam.x - nx;
					const dy = cam.y - ny;
					const dz = cam.z - nz;
					const dd = dx * dx + dy * dy + dz * dz;
					const mesh = this.getMesh(nx, ny, nz);
					if (mesh) {
						const alpha = Math.min(
							1.0,
							(ticks - mesh.createdAt) * (1.0 / 24.0),
						);
						const mask = this.calcMask(x, y, z);
						if (drawQLen < this.drawQueue.length) {
							const o = this.drawQueue[drawQLen];
							o.dd = dd;
							o.mesh = mesh;
							o.mask = mask;
							o.alpha = alpha;
						} else {
							this.drawQueue.push({ dd, mesh, mask, alpha });
						}
						drawQLen++;
						if (mesh.lastUpdated >= mesh.chunk.lastUpdated) {
							continue;
						}
					}
					this.generatorQueue.push({ dd, x: nx, y: ny, z: nz });
				}
			}
		}
		this.chunksDrawn = drawn;
		this.chunksSkipped = skipped;

		if (this.generatorQueue.length) {
			this.generatorQueue.sort((a, b) => b.dd - a.dd);
		}
		let drawCalls = 0;

		/* Here we sort all the chunks back to front, draw the solid blocks first and then
		 * draw all the seeThrough blocks like water. This is necessary for alpha blending to work properly.
		 */
		this.drawQueue.length = drawQLen;
		this.drawQueue.sort((a, b) => b.dd - a.dd);
		for (const { mesh, mask, alpha } of this.drawQueue) {
			drawCalls += mesh.drawFast(mask, alpha, 0);
		}
		for (const { mesh, mask, alpha } of this.drawQueue) {
			drawCalls += mesh.drawFast(mask, alpha, 6);
		}
		this.renderer.game.profiler.addAmount("blockMeshDrawCalls", drawCalls);
	}
}
