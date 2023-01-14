import "../../../types";
import { Shader } from "../../shader";
import { Texture } from "../../texture";
import { WavefrontFile, WavefrontObject } from "./objLoader";

let gl: WebGL2RenderingContext;
let shader: Shader;

import shaderVertSource from "./mesh.vert?raw";
import shaderFragSource from "./mesh.frag?raw";
import { mat4 } from "gl-matrix";

export const meshMeshInit = (glc: WebGL2RenderingContext) => {
    gl = glc;
    shader = new Shader(gl, 'textMesh', shaderVertSource, shaderFragSource, ["cur_tex", "mat_mvp"]);
};

import pearObjSource from "../../../../assets/gfx/pear.obj?raw";
import pearPng from "../../../../assets/gfx/pear.png";

export const createPear = ():Mesh => {
    const tex = new Texture(gl, 'pear', pearPng);
    const mesh = new Mesh(tex);
    const obj = new WavefrontFile(pearObjSource);
    mesh.addObj(obj.objects[0]);
    mesh.finish();
    return mesh;
};

export class Mesh {
    vertices:number[] = [];
    elementCount = 0;
    texture: Texture;
    vao: WebGLVertexArrayObject;
    finished = false;

    constructor (texture: Texture) {
        const vao = gl.createVertexArray();
        if(!vao){throw new Error("Couldn't create VAO");}

        this.vao = vao;
        this.texture = texture;
    }

    addObj(obj: WavefrontObject) {
        for(const f of obj.faces){
            const pos = obj.positions[f.positionIndex];
            this.vertices.push(pos[0]);
            this.vertices.push(pos[1]);
            this.vertices.push(pos[2]);

            if(f.textureCoordinateIndex === undefined){throw new Error("Missing texture coordinates");}
            const tex = obj.textureCoordinates[f.textureCoordinateIndex];
            this.vertices.push(tex[0]);
            this.vertices.push(tex[1]);

            this.vertices.push(1.0); // Lightness
        }
    }

    finish () {
        gl.bindVertexArray(this.vao);

        const vertex_buffer = gl.createBuffer();
        if(!vertex_buffer){throw new Error("Can't create new textMesh vertex buffer!");}
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

        const float_arr = new Float32Array(this.vertices);
        gl.bufferData(gl.ARRAY_BUFFER, float_arr, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * 4, 0);
        gl.enableVertexAttribArray(0);

        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 6 * 4, 3 * 4);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 6 * 4, 5 * 4);
        gl.enableVertexAttribArray(2);
        this.finished = true;
        this.elementCount = this.vertices.length / 5;
    }

    draw (mat_mvp: mat4) {
        if(!this.finished){ throw new Error("Trying to draw unfinished mesh"); }
        shader.bind();
        shader.uniform4fv("mat_mvp", mat_mvp);
        this.texture.bind();
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.elementCount);
    }
}