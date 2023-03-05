/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/woodWand.png';
import meshUrl from '../../../assets/vox/items/woodWand.vox?url';

import { Character } from '../../world/character';
import { Entity } from '../../world/entity/entity';
import { Item } from '../../world/item/item';

export class WoodWand extends Item {
    attackSkill = ['clubmanship', 'onehanded'];
    isWeapon = true;
    icon = itemIcon;
    meshUrl = meshUrl;

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
