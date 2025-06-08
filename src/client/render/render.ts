/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from "gl-matrix";

import type { ClientGame } from "../clientGame";
import { coordinateToWorldKey } from "../../world/world";
import { AssetList } from "./asset";
import { DecalMesh } from "./meshes/decalMesh/decalMesh";
import { ParticleMesh } from "./meshes/particleMesh/particleMesh";
import { allTexturesLoaded } from "./texture";
import { Camera } from "./camera";
import { WorldRenderer } from "./worldRenderer";
import { Div } from "../ui/utils";
import { Sky } from "./sky";
import { CloudMesh } from "./meshes/cloudMesh/cloudMesh";
import { TextRenderer } from "./textRenderer";
import { Character } from "../../world/entity/character";

const projectionMatrix = mat4.create();
const viewMatrix = mat4.create();

export class RenderManager {
	game: ClientGame;
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
	clouds: CloudMesh;
	textRenderer: TextRenderer;

	setPlatformDefaults() {
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
			this.renderDistance = 128;
		}
	}

	constructor(game: ClientGame) {
		this.game = game;
		this.setPlatformDefaults();
		this.canvas = document.createElement("canvas");
		this.canvas.classList.add("wolkenwelten-canvas");
		this.canvasWrapper = Div({ class: "wolkenwelten-canvas-wrapper" });
		game.ui.rootElement.append(this.canvasWrapper);
		this.canvasWrapper.append(this.canvas);
		const gl = this.canvas.getContext("webgl2");
		if (!gl) {
			throw new Error(
				"Can't create WebGL2 context, please try upgrading your browser or use a different device",
			);
		}
		this.gl = gl;
		this.initGLContext();
		this.assets = new AssetList(game, gl);

		this.camera = new Camera();

		this.world = new WorldRenderer(this);
		this.decals = new DecalMesh(this);
		this.particle = new ParticleMesh(this);
		this.sky = new Sky(this);
		this.clouds = new CloudMesh();

		// Initialize text renderer
		TextRenderer.init(gl);
		this.textRenderer = new TextRenderer();

		this.drawFrameClosure = this.drawFrame.bind(this);
		this.generateMeshClosue = this.generateMesh.bind(this);

		window.requestAnimationFrame(this.drawFrameClosure);
		setInterval(this.updateFPS.bind(this), 1000);
		window.addEventListener("resize", this.resize.bind(this));
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
			512.0,
		);
		this.camera.update();
		this.camera.calcUntranslatedViewMatrix(viewMatrix);
		this.sky.draw(projectionMatrix, viewMatrix);
		this.camera.calcViewMatrix(this.game.ticks, viewMatrix);

		// Now enable blending for transparent/alpha objects
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

		this.world.draw(projectionMatrix, viewMatrix, this.camera);

		// Draw clouds with blending
		this.clouds.drawLayers(
			projectionMatrix,
			viewMatrix,
			this.game.player?.x || 0,
			this.game.world.bottomOfTheWorld,
			this.game.player?.z || 0,
		);

		// Draw decals (shadows) after world but before UI elements
		const mvp = mat4.create();
		mat4.multiply(mvp, projectionMatrix, viewMatrix);
		this.decals.draw(mvp);

		// Draw particles
		this.particle.draw(mvp);

		// Draw player names last (as UI overlay, always visible)
		this.drawPlayerNames(projectionMatrix, viewMatrix);

		this.gl.disable(this.gl.BLEND);
	}

	private drawPlayerNames(projectionMatrix: mat4, viewMatrix: mat4) {
		// Collect all characters and their names
		for (const entity of this.game.world.entities.values()) {
			if (entity.T === "Character") {
				const character = entity as Character;
				const playerName = character.getPlayerName();

				if (playerName) {
					// Calculate distance to player for distance-based effects
					const cam = this.camera;
					const dx = character.x - cam.x;
					const dy = character.y - cam.y;
					const dz = character.z - cam.z;
					const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

					// Only show names within reasonable distance (about 50 blocks)
					const maxNameDistance = 50;
					if (distance > maxNameDistance) {
						continue;
					}

					// Calculate name alpha based on distance
					const renderDistance = this.renderDistance || 0;
					const characterAlpha = Math.min(
						1,
						Math.max(0, renderDistance - distance) / 8,
					);
					const nameAlpha =
						Math.min(1, Math.max(0, (maxNameDistance - distance) / 20)) *
						characterAlpha;

					// Scale text based on distance (but not too small)
					const baseScale = 1.2;
					const distanceScale = Math.max(0.8, Math.min(2.0, 20 / distance));
					const finalScale = baseScale * distanceScale;

					// Draw name above the player's head
					const nameHeight = 0.9; // Height above character
					this.textRenderer.drawTextBillboard(
						projectionMatrix,
						viewMatrix,
						playerName,
						character.x,
						character.y + nameHeight,
						character.z,
						finalScale,
						nameAlpha,
					);
				}
			}
		}
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
		if (!this.generateMeshClosureActive && this.world.generatorQueue.length) {
			this.generateMeshClosureActive = true;
			setTimeout(this.generateMeshClosue, 0);
		}
		if (this.wasUnderwater) {
			if (!this.game.player?.isUnderwater()) {
				this.wasUnderwater = false;
				this.canvasWrapper.classList.remove("fx-underwater");
			}
		} else {
			if (this.game.player?.isUnderwater()) {
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
