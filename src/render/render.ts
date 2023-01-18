import { Game } from '../game';
import { mat4 } from 'gl-matrix';
import { TextMesh, meshInit, Mesh, BlockMesh } from './meshes/meshes';
import { Entity } from '../entities/entities';
import { Sky } from './sky';
import { WorldRenderer } from './worldRenderer';
import { allTexturesLoaded } from './texture';

export class RenderManager {
    game: Game;
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    fov = 60;
    renderDistance = 128.0;
    width = 640;
    height = 480;
    frames = 0;
    fps = 0;
    drawFrameClosure: () => void;
    generateMeshClosue: () => void;
    generateMeshClosureActive = false;

    testMesh: TextMesh;
    pearMesh: Mesh;
    cam?: Entity;
    sky: Sky;
    world: WorldRenderer;

    constructor(game: Game) {
        this.game = game;

        this.canvas = document.createElement('canvas');
        game.rootElement.append(this.canvas);
        const gl = this.canvas.getContext('webgl2');
        if (!gl) {
            throw new Error(
                "Can't create WebGL2 context, please try upgrading your browser or use a different device"
            );
        }
        this.gl = gl;
        this.initGLContext();
        meshInit(gl);

        this.sky = new Sky(this);
        this.testMesh = new TextMesh();
        this.pearMesh = Mesh.createPear();
        this.world = new WorldRenderer(this);

        this.drawFrameClosure = this.drawFrame.bind(this);
        this.generateMeshClosue = this.generateMesh.bind(this);
        window.requestAnimationFrame(this.drawFrameClosure);
        setInterval(this.updateFPS.bind(this), 1000);

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
    }

    updateFPS() {
        const fps = this.fps;
        this.fps = 0;
        this.game.ui.updateFPS(fps);
    }

    initGLContext() {
        this.gl.clearColor(0.5, 0.3, 0.1, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.blendFunc(
            this.gl.SRC_ALPHA,
            this.gl.ONE_MINUS_SRC_ALPHA
        );
    }

    drawScene() {
        if (!this.cam) {
            return;
        }

        const projectionMatrix = mat4.create();
        mat4.perspective(
            projectionMatrix,
            (this.fov * Math.PI) / 180,
            this.width / this.height,
            0.1,
            128.0
        );

        const viewMatrix = mat4.create();
        mat4.rotateX(viewMatrix, viewMatrix, -this.cam.pitch);
        mat4.rotateY(viewMatrix, viewMatrix, -this.cam.yaw);
        mat4.translate(viewMatrix, viewMatrix, [
            -this.cam.x,
            -this.cam.y,
            -this.cam.z,
        ]);
        //this.sky.draw(projectionMatrix, viewMatrix);
        this.world.draw(projectionMatrix, viewMatrix, this.cam);

        const modelMatrix = mat4.create();
        mat4.rotateY(modelMatrix, modelMatrix, this.frames / 140);
        mat4.multiply(modelMatrix, viewMatrix, modelMatrix);
        mat4.multiply(modelMatrix, projectionMatrix, modelMatrix);
        this.pearMesh.draw(modelMatrix);

        this.drawHud(projectionMatrix);
    }

    drawHud(projectionMatrix: mat4) {
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [1.5, -0.75, -1.75]);
        mat4.multiply(modelViewMatrix, projectionMatrix, modelViewMatrix);
        this.pearMesh.draw(modelViewMatrix);
    }

    resize() {
        this.width = window.innerWidth | 0;
        this.height = window.innerHeight | 0;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    generateMesh() {
        this.world.generateOneQueuedMesh();
        if(this.world.generatorQueue.length === 0){
            this.generateMeshClosureActive = false;
        } else {
            setTimeout(this.generateMeshClosue,0);
        }
    }

    drawFrame() {
        window.requestAnimationFrame(this.drawFrameClosure);
        if (!allTexturesLoaded()) {
            return;
        }
        this.frames++;
        this.fps++;

        this.gl.clearColor(0.09, 0.478, 1, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.drawScene();
        if(!this.generateMeshClosureActive && this.world.generatorQueue.length){
            this.generateMeshClosureActive = true;
            setTimeout(this.generateMeshClosue,0);
        }
    }
}
