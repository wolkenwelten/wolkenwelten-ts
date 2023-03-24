/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/stick.png';
import meshUrl from '../../../assets/vox/items/stick.vox?url';

import type { Entity } from '../../world/entity/entity';
import { Item } from '../../world/item/item';

export class Stick extends Item {
    name = 'Stick';
    icon = itemIcon;
    meshUrl = meshUrl;
    isWeapon = true;

    attackDamage(e: Entity): number {
        return 2;
    }

    attackCooldown(e: Entity): number {
        return 80;
    }
}
