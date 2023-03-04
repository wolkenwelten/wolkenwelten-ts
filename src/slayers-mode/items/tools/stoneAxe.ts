/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import stoneAxeIcon from '../../assets/gfx/items/stoneAxe.png';
import stoneAxeMesh from '../../assets/vox/items/stoneAxe.vox?url';

import { Character, Entity, Item } from '../../../engine';

export class StoneAxe extends Item {
    isWeapon = true;
    attackSkill = ['axefighting', 'onehanded'];
    icon = stoneAxeIcon;
    meshUrl = stoneAxeMesh;
    name = 'Stone Axe';

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
        return this.world.blocks[block].miningCat === 'Axe' ? 3 : 0;
    }

    onMineWith(e: Entity, block: number): void {
        if (e instanceof Character) {
            e.skillXpGain('axefighting', 1);
        }
    }
}
