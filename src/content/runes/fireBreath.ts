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
        let i = 0;
        e.stepIntoDirection((x, y, z) => {
            if (++i < 6) {
                return true;
            }
            const b = e.world.getBlock(x, y, z);
            if (!b) {
                e.world.fire.add(x, y, z, 4096);
            }
            if (i > 24) {
                return false;
            } else {
                return true;
            }
        });
        e.cooldown(80);
    }
}
