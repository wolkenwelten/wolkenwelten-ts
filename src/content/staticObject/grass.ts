/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import meshUrl from "../../../assets/vox/grass.vox?url";

import type { VoxelMesh } from "../../client/render/meshes/voxelMesh/voxelMesh";
import type { Entity } from "../../world/entity/entity";
import { StaticObject } from "../../world/chunk/staticObject";

export class StaticGrass extends StaticObject {
	mesh(): VoxelMesh {
		return this.chunk.world.game.render.assets.get(meshUrl);
	}

	transOff(): [number, number, number] {
		return [0.5, 6 / 32, 0.5];
	}

	onAttacked(perpetrator?: Entity) {
		this.chunk.world.game.audio.play("tock", 0.5);
		this.chunk.world.game.render.particle.fxBlockBreak(
			this.x,
			this.y,
			this.z,
			this.chunk.world.blocks[6],
		);
		this.destroy();
	}
}
