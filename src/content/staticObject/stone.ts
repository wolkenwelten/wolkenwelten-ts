/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import meshUrl from "../../../assets/vox/stone.vox?url";

import type { VoxelMesh } from "../../client/render/meshes/voxelMesh/voxelMesh";
import type { Entity } from "../../world/entity/entity";
import { StaticObject } from "../../world/chunk/staticObject";

export class StaticStone extends StaticObject {
	mesh(): VoxelMesh {
		return this.chunk.world.game.render.assets.get(meshUrl);
	}

	onAttacked(perpetrator?: Entity) {
		/*
		new ItemDrop(
			this.chunk.world,
			this.x + 0.5,
			this.y + 0.5,
			this.z + 0.5,
			Item.create("stone", this.chunk.world),
		);
		*/
		this.destroy();
	}

	transOff(): [number, number, number] {
		return [0.5 - 3 / 32, 1 / 32, 0.5 + 5 / 32];
	}
}
