import { Game } from "../game";
import { mat4 } from "gl-matrix";
import { TextMesh, meshInit, Mesh } from "./meshes";
import { createPear } from "./meshes/mesh";
import { Camera } from "./camera";

export class RenderManager {
    game: Game;
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    fov = 60;
    width = 640;
    height = 480;
    frames = 0;
    drawFrameClosure: () => void;

    testMesh: TextMesh;
    pearMesh: Mesh;
    cam = new Camera();

    constructor (game: Game) {
        this.game = game;

        this.canvas = document.createElement('canvas');
        game.rootElement.append(this.canvas);
        canvas: HTMLCanvasElement;
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

    initGLContext() {
        this.gl.clearColor(0.5,0.3,0.1,1.0);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
    }

    draw3DScene() {
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, this.fov * Math.PI / 180, this.width / this.height, 0.1, 512.0);

        const modelViewMatrix = mat4.create();
        mat4.translate(
          modelViewMatrix,
          modelViewMatrix,
          [-this.cam.x, -this.cam.y, -this.cam.z]
        );

        mat4.rotateY(modelViewMatrix, modelViewMatrix, this.frames / 140);

        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, modelViewMatrix);

        this.pearMesh.draw(modelViewProjectionMatrix);
    }

    draw3DHud() {
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, this.fov * Math.PI / 180, this.width / this.height, 0.1, 512.0);

        const modelViewMatrix = mat4.create();
        mat4.translate(
          modelViewMatrix,
          modelViewMatrix,
          [1.75, -0.7, -2.0]
        );

        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, modelViewMatrix);

        this.pearMesh.draw(modelViewProjectionMatrix);
    }

    draw2DHud() {
        const projectionMatrix = mat4.create();
        mat4.ortho(projectionMatrix, 0, this.width, this.height, 0, -1, 1);

        const modelViewMatrix = mat4.create();
        mat4.translate(
          modelViewMatrix,
          modelViewMatrix,
          [-512.0, Math.sin(this.frames / 120) * 256, 0.0]
        );

        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, modelViewMatrix);

        this.testMesh.draw(modelViewProjectionMatrix);
    }

    resize () {
        this.width = window.innerWidth|0;
        this.height = window.innerHeight|0;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    drawFrame () {
        window.requestAnimationFrame(this.drawFrameClosure);
        this.frames++;
        this.gl.clearColor(Math.sin(this.frames / 128),Math.sin(this.frames / 512), Math.sin(this.frames / 2048),1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.viewport(0,0, this.canvas.width, this.canvas.height);

        this.draw3DScene();
        this.draw3DHud();
        this.draw2DHud();

        this.gl.flush();
    }
}