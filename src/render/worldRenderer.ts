import { mat4, vec4 } from 'gl-matrix';

import { Frustum } from './frustum';
import { BlockMesh } from './meshes';
import { RenderManager } from '../render';
import { Entity } from '../world/entity';
import { coordinateToWorldKey } from '../world';

type QueueEntry = {
    dd: number;
    x: number;
    y: number;
    z: number;
};

const RENDER_STEPS = 5;

export class WorldRenderer {
    meshes: Map<number, BlockMesh> = new Map();
    renderer: RenderManager;
    generatorQueue: QueueEntry[] = [];
    frustum = new Frustum();
    chunksDrawn = 0;
    chunksSkipped = 0;

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
            return newMesh;
        } else {
            oldMesh.updateFromChunk(chunk);
            return oldMesh;
        }
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

    draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
        this.renderer.gl.enable(this.renderer.gl.BLEND);
        BlockMesh.bindShaderAndTexture(projectionMatrix, viewMatrix);
        const cx = cam.x & ~31;
        const cy = cam.y & ~31;
        const cz = cam.z & ~31;
        const frustum = this.frustum;
        frustum.build(projectionMatrix, viewMatrix);
        let drawn = 0;
        let skipped = 0;

        this.generatorQueue.length = 0;
        const ticks = this.renderer.game.ticks;
        for (let x = -RENDER_STEPS; x <= RENDER_STEPS; x++) {
            for (let y = -RENDER_STEPS; y <= RENDER_STEPS; y++) {
                for (let z = -RENDER_STEPS; z <= RENDER_STEPS; z++) {
                    const nx = cx + x * 32;
                    const ny = cy + y * 32;
                    const nz = cz + z * 32;
                    if (!frustum.containsCube(vec4.fromValues(nx, ny, nz, 1))) {
                        skipped++;
                        continue;
                    }
                    drawn++;
                    const mesh = this.getMesh(nx, ny, nz);
                    if (mesh) {
                        const alpha = Math.min(
                            1.0,
                            (ticks - mesh.createdAt) * (1.0 / 16.0)
                        );
                        mesh.drawFast(this.calcMask(x, y, z), alpha);
                        if (mesh.lastUpdated >= mesh.chunk.lastUpdated) {
                            continue;
                        }
                    }
                    const dx = cam.x - nx;
                    const dy = cam.y - ny;
                    const dz = cam.z - nz;
                    const dd = dx * dx + dy * dy + dz * dz;
                    this.generatorQueue.push({ dd, x: nx, y: ny, z: nz });
                }
            }
        }
        this.chunksDrawn = drawn;
        this.chunksSkipped = skipped;

        if (this.generatorQueue.length) {
            this.generatorQueue.sort((a, b) => b.dd - a.dd);
        }

        this.renderer.gl.disable(this.renderer.gl.BLEND);
    }
}
