/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Entity } from "../../world/entity/entity";
import { Item } from "../../world/item/item";

export class Rune extends Item {
	isWeapon = false;

	attackDamage(e: Entity): number {
		return 0;
	}
}
