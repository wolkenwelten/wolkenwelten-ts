/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/stick.png';
import meshUrl from '../../../assets/vox/items/stick.vox?url';

import { Character } from '../../world/character';
import type { Entity } from '../../world/entity/entity';
import { Item } from '../../world/item/item';

export class Stick extends Item {
    name = 'Stick';
    icon = itemIcon;
    meshUrl = meshUrl;
    attackSkill = ['onehanded'];
    isWeapon = true;

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
