/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/fireBreath.png';
import meshUrl from '../../../assets/vox/items/stone.vox?url';
import { Character } from '../../world/entity/character';

import { Rune } from './rune';

export class FireBreath extends Rune {
    name = 'Fire breath';
    icon = itemIcon;
    meshUrl = meshUrl;

    use(e: Character) {
        if (e.isOnCooldown()) {
            return;
        }
        let i = 0;
        let firesSpawned = 0;
        e.stepIntoDirection((x, y, z) => {
            i++;
            const b = e.world.getBlock(x, y, z);
            if (!b) {
                if(i > 6){
                    e.world.fire.add(x, y, z, 4096);
                    firesSpawned++;
                }
            } else {
                return false;
            }
            if (i > 24) {
                return false;
            } else {
                return true;
            }
        });
        if(firesSpawned === 0){
            return;
        }
        this.world.game.render.shake.add(1);
        e.cooldown(64);
        e.hitAnimation = this.world.game.render.frames;
        e.playSound('bomb', 0.2);
    }
}
