import { mat4 } from "gl-matrix";

import { BlockMesh, chunkIntoMesh } from "../meshes";
import { RenderManager } from "../";
import { Entity } from "../../entities";
import { coordinateToWorldKey } from '../../world';

const RENDER_STEPS = 3;

export class WorldRenderer {
    meshes: Map<number, BlockMesh> = new Map();
    renderer: RenderManager;

    constructor (renderer: RenderManager) {
        this.renderer = renderer;
    }

    getMesh(x:number, y:number, z:number):BlockMesh | undefined {
        const key = coordinateToWorldKey(x,y,z);
        const ret = this.meshes.get(key);
        if(ret){ return ret; }
        const chunk = this.renderer.game.world.getOrGenChunk(x,y,z);
        if(!chunk) { return undefined; }
        const newMesh = chunkIntoMesh(chunk);
        this.meshes.set(key, newMesh);
        return newMesh;
    }

    draw (projectionMatrix:mat4, viewMatrix:mat4, cam:Entity) {
        this.renderer.gl.enable(this.renderer.gl.BLEND);
        this.renderer.gl.blendFunc(this.renderer.gl.SRC_ALPHA, this.renderer.gl.ONE_MINUS_SRC_ALPHA);
        BlockMesh.bindShaderAndTexture(projectionMatrix, viewMatrix);
        const cx = cam.x & ~31;
        const cy = cam.y & ~31;
        const cz = cam.z & ~31;
        for(let x = -RENDER_STEPS;x<=RENDER_STEPS;x++){
            for(let y = -RENDER_STEPS;y<=RENDER_STEPS;y++){
                for(let z = -RENDER_STEPS;z<=RENDER_STEPS;z++){
                    const nx = cx + x * 32;
                    const ny = cy + y * 32;
                    const nz = cz + z * 32;
                    this.getMesh(nx,ny,nz)?.drawFast();
                }
            }
        }
        this.renderer.gl.disable(this.renderer.gl.BLEND);
    }
}