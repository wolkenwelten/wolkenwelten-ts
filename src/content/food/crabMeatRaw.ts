/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/crabMeatRaw.png';
import meshUrl from '../../../assets/vox/items/crabMeatRaw.vox?url';

import type { Entity } from '../../world/entity/entity';
import { Character } from '../../world/character';
import { Item } from '../../world/item/item';

export class CrabMeatRaw extends Item {
    name = 'Crab meat';
    icon = itemIcon;
    meshUrl = meshUrl;
    stackSize = 20;

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
