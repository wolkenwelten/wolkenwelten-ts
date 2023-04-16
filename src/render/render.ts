/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from 'gl-matrix';

import type { Game } from '../game';
import type { Entity } from '../world/entity/entity';
import { coordinateToWorldKey } from '../world/world';
import { AssetList } from './asset';
import { DecalMesh } from './meshes/decalMesh/decalMesh';
import { ParticleMesh } from './meshes/particleMesh/particleMesh';
import { allTexturesLoaded } from './texture';
import { WorldRenderer } from './worldRenderer';

const transPos = new Float32Array([0, 0, 0]);
const projectionMatrix = mat4.create();
const viewMatrix = mat4.create();
const modelViewMatrix = mat4.create();

export class RenderManager {
    game: Game;
    canvas: HTMLCanvasElement;
    canvasWrapper: HTMLElement;
    gl: WebGL2RenderingContext;
    fov = 90;
    renderDistance = 160.0;
    width = 640;
    height = 480;
    frames = 0;
    fps = 0;
    fpsCounter = 0;
    drawFrameClosure: () => void;
    generateMeshClosue: () => void;
    generateMeshClosureActive = false;
    wasUnderwater = false;
    renderSizeMultiplier = 1;

    assets: AssetList;
    decals: DecalMesh;
    particle: ParticleMesh;
    cam: Entity;
    world: WorldRenderer;

    setPlatformDefaults() {
        const isFirefox =
            navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        const isSafari = /^((?!chrome|android).)*safari/i.test(
            navigator.userAgent
        );
        const isMobile =
            navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i);
        const isARM =
            navigator.userAgent.match(/aarch64/i) ||
            navigator.userAgent.match(/armhf/i);

        if (isFirefox || isSafari || isMobile || isARM) {
            // Reduce default renderDistance due to performance issues
            this.renderDistance = 96;
        }
    }

    constructor(game: Game, cam: Entity) {
        this.game = game;
        this.setPlatformDefaults();
        this.cam = cam;
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('wolkenwelten-canvas');
        this.canvasWrapper = document.createElement('div');
        this.canvasWrapper.classList.add('wolkenwelten-canvas-wrapper');
        game.ui.rootElement.append(this.canvasWrapper);
        this.canvasWrapper.append(this.canvas);
        const gl = this.canvas.getContext('webgl2');
        if (!gl) {
            throw new Error(
                "Can't create WebGL2 context, please try upgrading your browser or use a different device"
            );
        }
        this.gl = gl;
        this.initGLContext();
        this.assets = new AssetList(game, gl);

        this.world = new WorldRenderer(this);
        this.decals = new DecalMesh(this);
        this.particle = new ParticleMesh(this);

        this.drawFrameClosure = this.drawFrame.bind(this);
        this.generateMeshClosue = this.generateMesh.bind(this);
        window.requestAnimationFrame(this.drawFrameClosure);
        setInterval(this.updateFPS.bind(this), 1000);

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
    }

    updateFPS() {
        this.fps = this.fpsCounter;
        this.fpsCounter = 0;
    }

    initGLContext() {
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.clearColor(0.09, 0.478, 1, 1);
    }

    updateFOV() {
        const shouldFOV = 90;
        this.fov = this.fov * 0.95 + shouldFOV * 0.05;
    }

    drawScene() {
        this.updateFOV();
        mat4.perspective(
            projectionMatrix,
            (this.fov * Math.PI) / 180,
            this.width / this.height,
            0.1,
            512.0
        );

        mat4.identity(viewMatrix);
        mat4.rotateX(viewMatrix, viewMatrix, -this.cam.pitch);
        mat4.rotateY(viewMatrix, viewMatrix, -this.cam.yaw);
        transPos[0] = -this.cam.x;
        transPos[1] = -(this.cam.y + this.cam.camOffY());
        transPos[2] = -this.cam.z;
        mat4.translate(viewMatrix, viewMatrix, transPos);

        this.gl.enable(this.gl.BLEND);
        this.world.draw(projectionMatrix, viewMatrix, this.cam);
        mat4.multiply(viewMatrix, projectionMatrix, viewMatrix);
        this.decals.draw(viewMatrix);
        this.gl.disable(this.gl.BLEND);

        this.particle.draw(viewMatrix);
        this.drawHud(projectionMatrix);
    }

    drawHUDWeapon(projectionMatrix: mat4) {
        mat4.identity(modelViewMatrix);
        let r = Math.PI * -0.04;
        let rt = 0;
        if (this.game.player.hitAnimation >= 0) {
            const t = (this.frames - this.game.player.hitAnimation) / 20.0;
            if (t > 1) {
                this.game.player.hitAnimation = -1;
            } else {
                rt = t * Math.PI;
                const rMax =
                    this.game.player.equipmentWeapon() === undefined
                        ? 0.125
                        : 0.4;
                r = Math.PI * (0.1 - Math.sin(t * Math.PI) * rMax);
            }
        }
        const player = this.game.player;
        const viewBob = Math.sin(player.walkCycleCounter) * 0.02;
        const viewBobH = Math.sin(player.walkCycleCounter * 0.5) * 0.03;
        const jumpOff = player.jumpAnimeFactor * -0.2;
        const rl = Math.sin(rt);
        const mesh = this.game.player.hudMesh();
        transPos[0] = 0.6 - rl * 0.2 + viewBobH + player.inertiaX * 0.5;
        transPos[1] = -0.6 + rl * 0.2 + viewBob + jumpOff;
        transPos[2] = -0.5 - rl * 0.25 + player.inertiaZ * 0.5;
        mat4.translate(modelViewMatrix, modelViewMatrix, transPos);
        mat4.rotateX(modelViewMatrix, modelViewMatrix, r);
        mat4.multiply(modelViewMatrix, projectionMatrix, modelViewMatrix);

        mesh.draw(modelViewMatrix, 1.0);
    }

    drawHud(projectionMatrix: mat4) {
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
        this.drawHUDWeapon(projectionMatrix);
    }

    resize() {
        this.width = (window.innerWidth | 0) * this.renderSizeMultiplier;
        this.height = (window.innerHeight | 0) * this.renderSizeMultiplier;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    generateMesh() {
        for (let i = 0; i < 4; i++) {
            this.world.generateOneQueuedMesh();
            if (this.world.queueEntryIsFarAway()) {
                break;
            }
        }
        if (this.world.generatorQueue.length === 0) {
            this.generateMeshClosureActive = false;
        } else {
            setTimeout(this.generateMeshClosue, 0);
        }
    }

    drawFrame() {
        window.requestAnimationFrame(this.drawFrameClosure);
        this.game.ui.update();

        this.frames++;
        this.fpsCounter++;
        if (!this.game.ready || !this.game.running || !allTexturesLoaded()) {
            return;
        }
        this.game.input.update();
        this.game.update();

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
