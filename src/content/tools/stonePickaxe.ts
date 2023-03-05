/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/stonePickaxe.png';
import meshUrl from '../../../assets/vox/items/stonePickaxe.vox?url';

import { Character } from '../../world/character';
import { Entity } from '../../world/entity/entity';
import { Item } from '../../world/item/item';

export class StonePickaxe extends Item {
    name = 'Stone pickaxe';
    icon = itemIcon;
    meshUrl = meshUrl;
    isWeapon = true;
    attackSkill = ['pickeneering', 'onehanded'];

    attackDamage(e: Entity): number {
        return 4;
    }

    attackCooldown(e: Entity): number {
        let multiplier = 1;
        if (e instanceof Character) {
            multiplier -= e.skillLevel('axefighting') * 0.1;
            multiplier -= e.skillLevel('onehanded') * 0.03;
        }
        return 80 * multiplier;
    }

    miningDamage(block: number): number {
        return this.world.blocks[block].miningCat === 'Pickaxe' ? 3 : 0;
    }

    onMineWith(e: Entity, block: number): void {
        if (e instanceof Character) {
            e.skillXpGain('pickeneering', 1);
        }
    }
}
