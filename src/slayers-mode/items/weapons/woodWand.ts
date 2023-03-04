/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import woodWandIcon from '../../assets/gfx/items/woodWand.png';
import woodWandMesh from '../../assets/vox/items/woodWand.vox?url';

import { Character, Entity, Item } from '../../../engine';

export class WoodWand extends Item {
    attackSkill = ['clubmanship', 'onehanded'];
    isWeapon = true;
    icon = woodWandIcon;
    meshUrl = woodWandMesh;
    name = 'Wood wand';

    attackDamage(e: Entity): number {
        return 2;
    }

    attackCooldown(e: Entity): number {
        let multiplier = 1;
        if (e instanceof Character) {
            multiplier -= e.skillLevel('clubmanship') * 0.1;
            multiplier -= e.skillLevel('onehanded') * 0.03;
        }
        return 60 * multiplier;
    }
}
