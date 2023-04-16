/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/earthBullet.png';
import meshUrl from '../../../assets/vox/items/stone.vox?url';
import { Character } from '../../world/entity/character';

import { Rune } from './rune';

export class FireBreath extends Rune {
    name = 'Fire breath';
    icon = itemIcon;
    meshUrl = meshUrl;

    use(e: Character) {
        const ray = e.raycast(false);
        if (!ray) {
            return;
        }
        const [x, y, z] = ray;
        e.world.fire.add(x, y, z, 4096);
    }

    useRelease(e: Character) {}
}
