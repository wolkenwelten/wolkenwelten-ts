/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * AssetList is the central registry and loader for render-time assets: voxel
 * meshes, block textures, particles, clouds etc. It initialises all static
 * GPU resources once during game start-up and caches them for fast reuse.
 *
 * Highlights
 * ----------
 * • Simplistic URL→`VoxelMesh` cache to avoid duplicate network fetches.
 * • Dynamically builds block-type `TriangleMesh`es from world definition so
 *   content mods only require data changes, not engine code.
 * • One-stop initialisation for every render sub-system (`BlockMesh.init`,
 *   `CloudMesh.init`, …) to keep boot-strap code in one place.
 *
 * Common mistakes
 * ---------------
 * • Forgetting to call `generateBlockTypeMeshes()` after changing the block
 *   registry at runtime – the old meshes will persist.
 * • Asset URLs must be routed through the build system (Vite, Webpack…) so they
 *   end up in the final bundle; plain strings won't work.
 */
import voxelBagFile from "../../../assets/vox/bag.vox?url";
import voxelTestOutlineFile from "../../../assets/vox/testOutline.vox?url";

import voxelPlayerHeadFile from "../../../assets/vox/player/head.vox?url";
import voxelPlayerTorsoFile from "../../../assets/vox/player/torso.vox?url";
import voxelPlayerLeftLegFile from "../../../assets/vox/player/left_leg.vox?url";
import voxelPlayerRightLegFile from "../../../assets/vox/player/right_leg.vox?url";
import voxelPlayerLeftArmFile from "../../../assets/vox/player/left_arm.vox?url";
import voxelPlayerRightArmFile from "../../../assets/vox/player/right_arm.vox?url";

import type { Game } from "../../game";
import { BlockMesh } from "./meshes/blockMesh/blockMesh";
import { DecalMesh } from "./meshes/decalMesh/decalMesh";
import { ParticleMesh } from "./meshes/particleMesh/particleMesh";
import { TriangleMesh } from "./meshes/triangleMesh/triangleMesh";
import { VoxelMesh } from "./meshes/voxelMesh/voxelMesh";
import { Texture } from "./texture";
import { CloudMesh } from "./meshes/cloudMesh/cloudMesh";

export class AssetList {
	game: Game;
	gl: WebGL2RenderingContext;

	cache: Map<string, VoxelMesh> = new Map();

	bag: VoxelMesh;
	test: VoxelMesh;
	blockType: TriangleMesh[] = [];

	playerHead: VoxelMesh;
	playerTorso: VoxelMesh;
	playerLeftLeg: VoxelMesh;
	playerRightLeg: VoxelMesh;
	playerLeftArm: VoxelMesh;
	playerRightArm: VoxelMesh;

	/**
	 * Iterates over the block registry and creates one billboard-ish triangle
	 * mesh per entry. Should be called after every change to `world.blocks`.
	 */
	generateBlockTypeMeshes() {
		this.blockType.length = 0;
		const tex = new Texture(
			this.gl,
			"blocks2D",
			this.game.world.blockTextureUrl,
			"2D",
		);
		for (let i = 0; i < this.game.world.blocks.length; i++) {
			const mesh = new TriangleMesh(tex);
			mesh.addBlockType(this.game.world.blocks[i]);
			mesh.finish();
			this.blockType[i] = mesh;
		}
	}

	/**
	 * Lazy-loads and caches a `VoxelMesh` from a MagicaVoxel .vox file. Subsequent
	 * calls with the same URL are instant.
	 */
	load(url: string) {
		const c = VoxelMesh.fromVoxFile(url);
		this.cache.set(url, c);
		return c;
	}

	/**
	 * Returns a cached mesh if present, otherwise schedules loading via `load()`.
	 */
	get(url: string) {
		return this.cache.get(url) || this.load(url);
	}

	/**
	 * Fire-and-forget preloader useful for splash screens. Simply calls `get()`
	 * on every URL.
	 */
	preload(urls: string[]) {
		for (const url of urls) {
			this.get(url);
		}
	}

	/**
	 * Constructs and initialises *all* render assets. Must be invoked exactly once
	 * right after WebGL context creation.
	 */
	constructor(game: Game, gl: WebGL2RenderingContext) {
		this.game = game;
		this.gl = gl;
		BlockMesh.init(game, gl);
		CloudMesh.init(gl);
		DecalMesh.init(gl);
		TriangleMesh.init(gl);
		ParticleMesh.init(gl);
		VoxelMesh.init(gl);

		this.bag = VoxelMesh.fromVoxFile(voxelBagFile);
		this.test = VoxelMesh.fromVoxFile(voxelTestOutlineFile);
		this.playerHead = VoxelMesh.fromVoxFile(voxelPlayerHeadFile);
		this.playerTorso = VoxelMesh.fromVoxFile(voxelPlayerTorsoFile);
		this.playerLeftArm = VoxelMesh.fromVoxFile(voxelPlayerLeftArmFile);
		this.playerRightArm = VoxelMesh.fromVoxFile(voxelPlayerRightArmFile);
		this.playerLeftLeg = VoxelMesh.fromVoxFile(voxelPlayerLeftLegFile);
		this.playerRightLeg = VoxelMesh.fromVoxFile(voxelPlayerRightLegFile);
		this.generateBlockTypeMeshes();
	}
}
