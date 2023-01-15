import { mat4, vec3 } from "gl-matrix";

import { Texture } from "../texture";
import { Mesh, WavefrontFile } from "../meshes/mesh";
import { RenderManager } from "../";

import skyDomeFile from "../../../assets/gfx/skydome.obj?raw";
import skyTextureUrl from "../../../assets/gfx/sky.png";

export class Sky {
    mesh: Mesh;
    render: RenderManager;

    constructor (render: RenderManager) {
        this.render = render;
        const texture = new Texture(render.gl, 'sky', skyTextureUrl);
        texture.linear();
        this.mesh = new Mesh(texture);
        const obj = new WavefrontFile(skyDomeFile);
        this.mesh.addObj(obj.objects[0]);
        this.mesh.finish();
    }

    draw (projection: mat4, _view: mat4) {
        const view = mat4.create();
        mat4.rotateY(view, view, -this.render.cam.yaw);
        mat4.rotateX(view, view, -this.render.cam.pitch);

        const model = mat4.create();
        mat4.scale(model, model, vec3.fromValues(192,192,192));
        mat4.multiply(model, view, model);
        mat4.multiply(model, projection, model);
        this.mesh.draw(model);
    }
}
