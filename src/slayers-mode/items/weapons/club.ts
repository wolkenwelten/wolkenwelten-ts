/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import clubIcon from '../../assets/gfx/items/club.png';
import clubMesh from '../../assets/vox/items/club.vox?url';

import { Character, Entity, Item } from '../../../engine';

export class Club extends Item {
    attackSkill = ['clubmanship', 'onehanded'];
    isWeapon = true;
    icon = clubIcon;
    meshUrl = clubMesh;
    name = 'Club';

    attackDamage(e: Entity): number {
        return 5;
    }

    attackCooldown(e: Entity): number {
        let multiplier = 1;
        if (e instanceof Character) {
            multiplier -= e.skillLevel('clubmanship') * 0.1;
            multiplier -= e.skillLevel('onehanded') * 0.03;
        }
        return 70 * multiplier;
    }
}
