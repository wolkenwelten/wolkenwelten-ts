import { mat4 } from 'gl-matrix';

import { BlockMesh } from './meshes/meshes';
import { RenderManager } from './render';
import { Entity } from '../entities/entities';
import { coordinateToWorldKey } from '../world/world';

type QueueEntry = {
    dd:number,
    x:number,
    y:number,
    z:number,
}

const RENDER_STEPS = 3;

export class WorldRenderer {
    meshes: Map<number, BlockMesh> = new Map();
    renderer: RenderManager;
    generatorQueue:QueueEntry[] = [];

    constructor(renderer: RenderManager) {
        this.renderer = renderer;
    }

    generateOneQueuedMesh() {
        const entry = this.generatorQueue.pop();
        if(!entry){return;}
        const {x,y,z} = entry;

        const chunk = this.renderer.game.world.getOrGenChunk(x, y, z);
        const newMesh = BlockMesh.fromChunk(chunk);
        const key = coordinateToWorldKey(x, y, z);
        this.meshes.set(key, newMesh);
        return newMesh;
    }

    getMesh(x: number, y: number, z: number): BlockMesh | undefined {
        const key = coordinateToWorldKey(x, y, z);
        const ret = this.meshes.get(key);
        return ret;
    }

    calcMask(x:number,y:number,z:number):number {
        return +(z <= 0)
        | ((+(z>= 0)) << 1)
        | ((+(y<= 0)) << 2)
        | ((+(y>= 0)) << 3)
        | ((+(x>= 0)) << 4)
        | ((+(x<= 0)) << 5);
    }

    draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
        this.renderer.gl.enable(this.renderer.gl.BLEND);
        BlockMesh.bindShaderAndTexture(projectionMatrix, viewMatrix);
        const cx = cam.x & ~31;
        const cy = cam.y & ~31;
        const cz = cam.z & ~31;
        this.generatorQueue.length = 0;
        for (let x = -RENDER_STEPS; x <= RENDER_STEPS; x++) {
            for (let y = -RENDER_STEPS; y <= RENDER_STEPS; y++) {
                for (let z = -RENDER_STEPS; z <= RENDER_STEPS; z++) {
                    const nx = cx + x * 32;
                    const ny = cy + y * 32;
                    const nz = cz + z * 32;
                    const mesh = this.getMesh(nx, ny, nz);
                    if(mesh){
                        mesh.drawFast(this.calcMask(x,y,z));
                    } else {
                        const dx = cam.x - nx;
                        const dy = cam.y - ny;
                        const dz = cam.z - nz;
                        const dd = dx*dx + dy*dy + dz*dz;
                        this.generatorQueue.push({dd,x:nx,y:ny,z:nz});
                    }
                }
            }
        }
        if(this.generatorQueue.length){
            this.generatorQueue.sort((a,b) => b.dd - a.dd);
        }

        this.renderer.gl.disable(this.renderer.gl.BLEND);
    }
}
