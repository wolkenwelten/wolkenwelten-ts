/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import CrabMeatRawIcon from '../../assets/gfx/items/crabMeatRaw.png';
import crabMeatRawMesh from '../../assets/vox/items/crabMeatRaw.vox?url';

import { Character, Entity, Item } from '../../../engine';

export class CrabMeatRaw extends Item {
    icon = CrabMeatRawIcon;
    meshUrl = crabMeatRawMesh;
    name = 'Crab meat';
    stackSize = 99;

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
