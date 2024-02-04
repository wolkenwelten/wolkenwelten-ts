/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/stone.png';
import meshUrl from '../../../assets/vox/items/stone.vox?url';

import type { VoxelMesh } from '../../render/meshes/voxelMesh/voxelMesh';
import type { Entity } from '../../world/entity/entity';
import { Character } from '../../world/entity/character';
import { Being } from '../../world/entity/being';
import { ItemDrop } from '../../world/entity/itemDrop';
import { Projectile } from '../../world/entity/projectile';
import { Item } from '../../world/item/item';

export class Stone extends Item {
	name = 'Stone';
	icon = itemIcon;
	meshUrl = meshUrl;
	stackSize = 99;

	use(user: Entity) {
		if (!this.destroyed && user instanceof Character) {
			if (user.isOnCooldown()) {
				return;
			}
			user.cooldown(50);
			if (--this.amount <= 0) {
				this.destroy();
			}
			user.hitAnimation = this.world.game.render.frames;
			user.inventory.updateAll();

			const proj = new Projectile(user, 1.4);
			proj.projectileMesh = this.mesh() as VoxelMesh;
			proj.playSound('projectile', 0.05, true);
			user.playUnmovingSound('punchMiss', 0.5);
			proj.onHit = function (this: Projectile, e: Entity) {
				if (e instanceof Being) {
					user.doDamage(e, 1);
				}
				this.world.game.render.particle.fxStrike(e.x, e.y, e.z);
				new ItemDrop(
					this.world,
					this.x,
					this.y,
					this.z,
					new Stone(this.world, 1)
				);
			};
			proj.onMiss = function (this: Projectile) {
				new ItemDrop(
					this.world,
					this.x,
					this.y,
					this.z,
					new Stone(this.world, 1)
				);
			};
		}
	}
}
