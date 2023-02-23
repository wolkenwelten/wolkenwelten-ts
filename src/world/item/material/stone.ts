/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/stone.png';
import meshUrl from '../../../../assets/vox/items/stone.vox?url';
import { StackableItem } from '../stackableItem';
import { Character } from '../../entity/character';
import { Projectile } from '../../entity/projectile';
import { ItemDrop } from '../../entity/itemDrop';

export class Stone extends StackableItem {
    constructor(world: World, amount = 1) {
        super(world, amount, 'Stone');
    }

    icon(): string {
        return itemIcon;
    }

    use(user: Entity) {
        if (!this.destroyed && user instanceof Character) {
            if (this.world.game.ticks < user.lastAction) {
                return;
            }
            user.cooldown(60);
            if (--this.amount <= 0) {
                this.destroy();
            }
            user.lastUsedSkill = ['throwing'];
            user.hitAnimation = this.world.game.render.frames;
            user.inventory.updateAll();

            const proj = new Projectile(user, 1);
            proj.projectileMesh = this.mesh(this.world) as VoxelMesh;
            proj.onHit = function (this: Projectile, e: Entity) {
                user.doDamage(e, 1);
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

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
