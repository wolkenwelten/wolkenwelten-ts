/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import meshUrl from "../../../assets/vox/staticShell.vox?url";

import type { Entity } from "../../world/entity/entity";
import { StaticObject } from "../../world/chunk/staticObject";

export class StaticShell extends StaticObject {
	mesh() {
		return this.chunk.world.game.render?.assets.get(meshUrl) || null;
	}

	onAttacked(perpetrator?: Entity) {
		this.destroy();
	}

	transOff(): [number, number, number] {
		return [0.5 - 6 / 32, 1 / 32, 0.5 + 4 / 32];
	}
}
