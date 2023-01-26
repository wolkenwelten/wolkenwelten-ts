import { Game } from './game';
import { mat4, vec3 } from 'gl-matrix';
import { meshInit, Mesh, VoxelMesh } from './render/meshes';
import { Entity } from './world/entity';
import { WorldRenderer } from './render/worldRenderer';
import { allTexturesLoaded } from './render/texture';
import { coordinateToWorldKey } from './world';

import voxelFistFile from '../assets/vox/fist.vox?url';

export class RenderManager {
    game: Game;
    canvas: HTMLCanvasElement;
    canvasWrapper: HTMLElement;
    gl: WebGL2RenderingContext;
    fov = 60;
    renderDistance = 160.0;
    width = 640;
    height = 480;
    frames = 0;
    fps = 0;
    drawFrameClosure: () => void;
    generateMeshClosue: () => void;
    generateMeshClosureActive = false;
    renderSizeMultiplier = 1;

    pearMesh: Mesh;
    fistMesh: VoxelMesh;
    cam?: Entity;
    world: WorldRenderer;

    wasUnderwater = false;

    constructor(game: Game) {
        this.game = game;
        this.canvas = document.createElement('canvas');
        this.canvasWrapper = document.createElement('div');
        game.rootElement.append(this.canvasWrapper);
        this.canvasWrapper.append(this.canvas);
        const gl = this.canvas.getContext('webgl2');
        if (!gl) {
            throw new Error(
                "Can't create WebGL2 context, please try upgrading your browser or use a different device"
            );
        }
        this.gl = gl;
        this.initGLContext();
        meshInit(gl);

        this.pearMesh = Mesh.createPear();
        this.world = new WorldRenderer(this);
        this.fistMesh = VoxelMesh.fromVoxFile(voxelFistFile);

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
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.clearColor(0.09, 0.478, 1, 1);
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
            512.0
        );

        const viewMatrix = mat4.create();
        mat4.rotateX(viewMatrix, viewMatrix, -this.cam.pitch);
        mat4.rotateY(viewMatrix, viewMatrix, -this.cam.yaw);
        mat4.translate(viewMatrix, viewMatrix, [
            -this.cam.x,
            -this.cam.y,
            -this.cam.z,
        ]);
        this.world.draw(projectionMatrix, viewMatrix, this.cam);

        this.drawHud(projectionMatrix);
    }

    drawHud(projectionMatrix: mat4) {
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.35, -0.75, -1.5]);
        mat4.scale(
            modelViewMatrix,
            modelViewMatrix,
            vec3.fromValues(1 / 32, 1 / 32, 1 / 32)
        );
        let r = Math.PI * 0.1;
        if (this.game.player.hitAnimation >= 0) {
            const t = (this.frames - this.game.player.hitAnimation) / 15.0;
            if (t > 1) {
                this.game.player.hitAnimation = -1;
            } else {
                r = Math.PI * (0.1 - Math.sin(t * Math.PI) * 0.125);
            }
        }
        mat4.rotateX(modelViewMatrix, modelViewMatrix, r);
        this.fistMesh.draw(projectionMatrix, modelViewMatrix, 1.0);
    }

    resize() {
        this.width = (window.innerWidth | 0) * this.renderSizeMultiplier;
        this.height = (window.innerHeight | 0) * this.renderSizeMultiplier;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    generateMesh() {
        this.world.generateOneQueuedMesh();
        if (this.world.generatorQueue.length === 0) {
            this.generateMeshClosureActive = false;
        } else {
            setTimeout(this.generateMeshClosue, 0);
        }
    }

    drawFrame() {
        window.requestAnimationFrame(this.drawFrameClosure);
        this.game.update(); // First we update the game world, so that we render the most up to version
        if (!this.game.ready || !allTexturesLoaded()) {
            return;
        }
        this.frames++;
        this.fps++;

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.drawScene();
        if (
            !this.generateMeshClosureActive &&
            this.world.generatorQueue.length
        ) {
            this.generateMeshClosureActive = true;
            setTimeout(this.generateMeshClosue, 0);
        }
        if (this.wasUnderwater) {
            if (!this.game.player.isUnderwater()) {
                this.wasUnderwater = false;
                this.canvasWrapper.classList.remove('fx-underwater');
            }
        } else {
            if (this.game.player.isUnderwater()) {
                this.wasUnderwater = true;
                this.canvasWrapper.classList.add('fx-underwater');
            }
        }
    }

    dropBlockMesh(x: number, y: number, z: number) {
        const key = coordinateToWorldKey(x, y, z);
        const mesh = this.world.meshes.get(key);
        if (!mesh) {
            return;
        }
        this.world.meshes.delete(key);
        this.gl.deleteBuffer(mesh.vbo);
        this.gl.deleteVertexArray(mesh.vao);
    }
}
