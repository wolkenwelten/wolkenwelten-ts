/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import stickIcon from '../../assets/gfx/items/stick.png';
import stickMesh from '../../assets/vox/items/stick.vox?url';

import { Character, Entity, Item } from '../../../engine';

export class Stick extends Item {
    attackSkill = ['onehanded'];
    isWeapon = true;
    icon = stickIcon;
    meshUrl = stickMesh;
    name = 'Stick';
    stackSize = 99;

    attackDamage(e: Entity): number {
        return 2;
    }

    attackCooldown(e: Entity): number {
        let multiplier = 1;
        if (e instanceof Character) {
            multiplier -= e.skillLevel('onehanded') * 0.03;
        }
        return 80 * multiplier;
    }
}
