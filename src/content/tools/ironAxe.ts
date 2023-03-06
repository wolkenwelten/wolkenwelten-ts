/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/ironAxe.png';
import meshUrl from '../../../assets/vox/items/ironAxe.vox?url';

import type { Entity } from '../../world/entity/entity';
import { StoneAxe } from './stoneAxe';

export class IronAxe extends StoneAxe {
    name = 'Iron axe';
    icon = itemIcon;
    meshUrl = meshUrl;
    attackSkill = ['axefighting', 'onehanded'];

    attackDamage(e: Entity): number {
        return 8;
    }

    miningDamage(block: number): number {
        return this.world.blocks[block].miningCat === 'Axe' ? 7 : 0;
    }
}
