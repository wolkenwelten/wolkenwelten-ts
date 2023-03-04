/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import ironPickaxeIcon from '../../assets/gfx/items/ironPickaxe.png';
import ironPickaxeMesh from '../../assets/vox/items/ironPickaxe.vox?url';

import { Entity } from '../../../engine';
import { StonePickaxe } from './stonePickaxe';

export class IronPickaxe extends StonePickaxe {
    attackSkill = ['pickeneering', 'onehanded'];
    icon = ironPickaxeIcon;
    meshUrl = ironPickaxeMesh;
    name = 'Iron Pickaxe';

    attackDamage(e: Entity): number {
        return 8;
    }

    miningDamage(block: number): number {
        return this.world.blocks[block].miningCat === 'Pickaxe' ? 7 : 0;
    }
}
