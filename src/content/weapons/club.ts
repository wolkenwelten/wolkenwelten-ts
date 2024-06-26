/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from "../../../assets/gfx/items/club.png";
import meshUrl from "../../../assets/vox/items/club.vox?url";

import type { Entity } from "../../world/entity/entity";
import { Item } from "../../world/item/item";

export class Club extends Item {
	isWeapon = true;
	name = "Club";
	icon = itemIcon;
	meshUrl = meshUrl;

	attackDamage(e: Entity): number {
		return 5;
	}

	attackCooldown(e: Entity): number {
		return 70;
	}
}
