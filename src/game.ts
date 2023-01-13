import { mat4 } from "gl-matrix";
import { TextMesh, meshInit, Mesh } from "./meshes";
import { createPear } from "./meshes/mesh";

export interface GameConfig {
    parent: HTMLElement,
}

export class Game {
    rootElement: HTMLElement;
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    width = 640;
    height = 480;
    frames = 0;
    drawFrameClosure: () => void;

    testMesh: TextMesh;
    pearMesh: Mesh;

    constructor (config: GameConfig) {
        this.rootElement = config.parent;
        this.canvas = document.createElement('canvas');
        this.rootElement.append(this.canvas);

        const gl = this.canvas.getContext('webgl2');
        if(!gl){ throw new Error("Can't create WebGL2 context, please try upgrading your browser or use a different device"); }
        this.gl = gl;
        this.initGLContext();
        meshInit(gl);
        this.testMesh = new TextMesh();
        this.pearMesh = createPear();

        this.drawFrameClosure = this.drawFrame.bind(this);
        window.requestAnimationFrame(this.drawFrameClosure);

        window.addEventListener("resize", this.resize.bind(this));
        this.resize();
    }

    resize () {
        this.width = window.innerWidth|0;
        this.height = window.innerHeight|0;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    initGLContext() {
        this.gl.clearColor(0.5,0.3,0.1,1.0);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
    }

    draw3DScene() {
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, 80.0 * Math.PI / 180, this.width / this.height, 0.1, 512.0);

        const modelViewMatrix = mat4.create();
        mat4.translate(
          modelViewMatrix, // destination matrix
          modelViewMatrix, // matrix to translate
          [0.0, -0.5, -2.0]
        );

        mat4.rotateY(modelViewMatrix, modelViewMatrix, this.frames / 140);

        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, modelViewMatrix);

        this.pearMesh.draw(modelViewProjectionMatrix);
    }

    draw2DScene() {
        const projectionMatrix = mat4.create();
        mat4.ortho(projectionMatrix, 0, this.width, this.height, 0, -1, 1);

        const modelViewMatrix = mat4.create();
        mat4.translate(
          modelViewMatrix, // destination matrix
          modelViewMatrix, // matrix to translate
          [-512.0, Math.sin(this.frames / 240) * 256, 0.0]
        );

        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, modelViewMatrix);

        this.testMesh.draw(modelViewProjectionMatrix);
    }

    drawFrame () {
        window.requestAnimationFrame(this.drawFrameClosure);
        this.frames++;
        this.gl.clearColor((this.frames & 127) / 128,0.3,0.1,1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.viewport(0,0, this.canvas.width, this.canvas.height);

        this.draw3DScene();
        this.draw2DScene();

        this.gl.flush();
    }
};
