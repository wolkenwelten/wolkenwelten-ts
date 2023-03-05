/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/ironPickaxe.png';
import meshUrl from '../../../assets/vox/items/ironPickaxe.vox?url';

import { Entity } from '../../world/entity/entity';
import { StonePickaxe } from './stonePickaxe';

export class IronPickaxe extends StonePickaxe {
    name = 'Iron pickaxe';
    icon = itemIcon;
    meshUrl = meshUrl;
    attackSkill = ['pickeneering', 'onehanded'];

    attackDamage(e: Entity): number {
        return 8;
    }

    miningDamage(block: number): number {
        return this.world.blocks[block].miningCat === 'Pickaxe' ? 7 : 0;
    }
}
