/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/crabMeatRaw.png';
import meshUrl from '../../../../assets/vox/items/crabMeatRaw.vox?url';
import { Character } from '../../character';
import { StackableItem } from '../stackableItem';
import { registerClass } from '../../../class';

export class CrabMeatRaw extends StackableItem {
    constructor(world: World, amount = 1) {
        super(world, amount, 'Crab meat');
    }

    icon(): string {
        return itemIcon;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }

    use(e: Entity) {
        if (!this.destroyed && e instanceof Character) {
            if (this.world.game.ticks < e.lastAction) {
                return;
            }
            if (e.health === e.maxHealth) {
                return;
            }
            e.cooldown(100);
            e.heal(4);
            this.world.game.audio.play('chomp', 0.5);
            if (--this.amount <= 0) {
                this.destroy();
            }
            e.hitAnimation = this.world.game.render.frames;
            e.inventory.updateAll();
        }
    }
}
registerClass(CrabMeatRaw);
