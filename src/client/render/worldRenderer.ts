/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";

import type { RenderManager } from "./render";
import type { Position } from "../../util/math";
import { coordinateToWorldKey } from "../../world/world";
import { Frustum } from "./frustum";
import { BlockMesh } from "./meshes/blockMesh/blockMesh";
import { VoxelMesh } from "./meshes/voxelMesh/voxelMesh";
import { VoxelMeshBlit } from "./meshes/voxelMesh/voxelMesh";

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

	generateOneQueuedMesh() {
		const entry = this.generatorQueue.pop();
		if (!entry) {
			return;
		}
		const { x, y, z } = entry;

		const chunk = this.renderer.game.world.getOrGenChunk(x, y, z);
		const oldMesh = this.getMesh(x, y, z);
		if (!oldMesh) {
			const newMesh = BlockMesh.fromChunk(chunk);
			const key = coordinateToWorldKey(x, y, z);
			this.meshes.set(key, newMesh);
		} else {
			oldMesh.updateFromChunk(chunk);
		}
	}

	queueEntryIsFarAway(): boolean {
		const entry = this.generatorQueue[this.generatorQueue.length - 1];
		if (!entry) {
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

	draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Position) {
		const cx = cam.x & ~31;
		const cy = cam.y & ~31;
		const cz = cam.z & ~31;
		const frustum = this.frustum;
		frustum.build(projectionMatrix, viewMatrix);
		for (const entity of this.renderer.game.world.entities) {
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

		let staticCalls = 0;

		const mvp = this.mvp;
		mat4.identity(mvp);
		mat4.mul(mvp, viewMatrix, mvp);
		mat4.mul(mvp, projectionMatrix, mvp);
		for (const { mesh } of this.drawQueue) {
			if (mesh.chunk.static.size === 0) {
				continue;
			}

			const key = coordinateToWorldKey(
				mesh.chunk.x,
				mesh.chunk.y,
				mesh.chunk.z,
			);
			let staticMesh = this.staticMeshes.get(key);
			if (!staticMesh) {
				staticMesh = new VoxelMesh();
				this.staticMeshes.set(key, staticMesh);
			}
			if (staticMesh.lastUpdated < mesh.chunk.staticLastUpdated) {
				const blits: VoxelMeshBlit[] = [];
				for (const s of mesh.chunk.static) {
					const transOff = s.transOff();
					const vertices = s.mesh().vertices;
					const x = (s.x - s.chunk.x + transOff[0]) * 32;
					const y = (s.y - s.chunk.y + transOff[1]) * 32;
					const z = (s.z - s.chunk.z + transOff[2]) * 32;
					blits.push({ vertices, x, y, z });
				}
				staticMesh.updateFromMultiple(blits, mesh.chunk.staticLastUpdated);
			}
			staticMesh.draw(
				mvp,
				1.0,
				mesh.chunk.x * 32,
				mesh.chunk.y * 32,
				mesh.chunk.z * 32,
			);
			staticCalls++;
		}

		this.renderer.game.profiler.addAmount("staticMeshesDrawCalls", staticCalls);
	}
}
