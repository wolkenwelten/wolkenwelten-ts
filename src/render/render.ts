/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";

import type { Game } from "../game";
import type { Entity } from "../world/entity/entity";
import { coordinateToWorldKey } from "../world/world";
import { AssetList } from "./asset";
import { DecalMesh } from "./meshes/decalMesh/decalMesh";
import { ParticleMesh } from "./meshes/particleMesh/particleMesh";
import { allTexturesLoaded } from "./texture";
import { Camera } from "./camera";
import { WorldRenderer } from "./worldRenderer";
import {
	isClient,
	isServer,
	mockCanvas,
	mockContextWebGL2,
} from "../util/compat";
import { Div } from "../ui/utils";
import { Sky } from "./sky";

const projectionMatrix = mat4.create();
const viewMatrix = mat4.create();

export class RenderManager {
	game: Game;
	canvas: HTMLCanvasElement;
	canvasWrapper: HTMLElement;
	gl: WebGL2RenderingContext;
	fov = 90;
	renderDistance = 256.0;
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
	camera: Camera;
	world: WorldRenderer;
	sky: Sky;

	setPlatformDefaults() {
		if (isServer()) {
			return;
		}
		const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
		const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
		const isMobile =
			navigator.userAgent.match(/Android/i) ||
			navigator.userAgent.match(/iPhone/i) ||
			navigator.userAgent.match(/iPad/i);
		const isARM =
			navigator.userAgent.match(/aarch64/i) ||
			navigator.userAgent.match(/armhf/i);

		if (isFirefox || isSafari || isMobile || isARM) {
			// Reduce default renderDistance due to performance issues
			this.renderDistance = 128;
		}
	}

	constructor(game: Game, cam: Entity) {
		this.game = game;
		this.setPlatformDefaults();
		this.canvas = isClient() ? document.createElement("canvas") : mockCanvas();
		this.canvas.classList.add("wolkenwelten-canvas");
		this.canvasWrapper = Div({ class: "wolkenwelten-canvas-wrapper" });
		game.ui.rootElement.append(this.canvasWrapper);
		this.canvasWrapper.append(this.canvas);
		const gl = isClient()
			? this.canvas.getContext("webgl2")
			: mockContextWebGL2();
		if (!gl) {
			throw new Error(
				"Can't create WebGL2 context, please try upgrading your browser or use a different device",
			);
		}
		this.gl = gl;
		this.initGLContext();
		this.assets = new AssetList(game, gl);
		this.camera = new Camera(cam);
		this.world = new WorldRenderer(this);
		this.decals = new DecalMesh(this);
		this.particle = new ParticleMesh(this);
		this.sky = new Sky(this);
		this.drawFrameClosure = this.drawFrame.bind(this);
		this.generateMeshClosue = this.generateMesh.bind(this);
		if (isClient()) {
			window.requestAnimationFrame(this.drawFrameClosure);
			setInterval(this.updateFPS.bind(this), 1000);
			window.addEventListener("resize", this.resize.bind(this));
			this.resize();
		}
	}

	updateFPS() {
		this.fps = this.fpsCounter;
		this.fpsCounter = 0;
	}

	initGLContext() {
		if (isServer()) {
			return;
		}
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
		if (isServer()) {
			return;
		}
		this.updateFOV();
		mat4.perspective(
			projectionMatrix,
			(this.fov * Math.PI) / 180,
			this.width / this.height,
			0.1,
			512.0,
		);
		this.camera.update();
		this.camera.calcUntranslatedViewMatrix(viewMatrix);
		this.sky.draw(projectionMatrix, viewMatrix);
		this.camera.calcViewMatrix(this.game.ticks, viewMatrix);

		this.gl.enable(this.gl.BLEND);

		this.world.draw(projectionMatrix, viewMatrix, this.camera);
		mat4.multiply(viewMatrix, projectionMatrix, viewMatrix);
		this.decals.draw(viewMatrix);
		this.particle.draw(viewMatrix);
		this.gl.disable(this.gl.BLEND);
	}

	resize() {
		if (isServer()) {
			return;
		}
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
		if (isServer()) {
			return;
		}
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
		if (!this.generateMeshClosureActive && this.world.generatorQueue.length) {
			this.generateMeshClosureActive = true;
			setTimeout(this.generateMeshClosue, 0);
		}
		if (this.wasUnderwater) {
			if (!this.game.player.isUnderwater()) {
				this.wasUnderwater = false;
				this.canvasWrapper.classList.remove("fx-underwater");
			}
		} else {
			if (this.game.player.isUnderwater()) {
				this.wasUnderwater = true;
				this.canvasWrapper.classList.add("fx-underwater");
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
		mesh.destroy();
	}
}
