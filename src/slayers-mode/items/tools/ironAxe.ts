/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import ironAxeIcon from '../../assets/gfx/items/ironAxe.png';
import ironAxeMesh from '../../assets/vox/items/ironAxe.vox?url';

import { Entity } from '../../../engine';
import { StoneAxe } from './stoneAxe';

export class IronAxe extends StoneAxe {
    attackSkill = ['axefighting', 'onehanded'];
    icon = ironAxeIcon;
    meshUrl = ironAxeMesh;
    name = 'Iron Axe';

    attackDamage(e: Entity): number {
        return 8;
    }

    miningDamage(block: number): number {
        return this.world.blocks[block].miningCat === 'Axe' ? 7 : 0;
    }
}
