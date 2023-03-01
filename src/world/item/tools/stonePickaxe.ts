/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/stonePickaxe.png';
import meshUrl from '../../../../assets/vox/items/stonePickaxe.vox?url';
import { Item } from '../item';
import { Character } from '../../character';
import { registerClass } from '../../../class';

export class StonePickaxe extends Item {
    isWeapon = true;
    attackSkill = ['pickeneering', 'onehanded'];

    constructor(world: World, name = 'Stone Pickaxe') {
        super(world, name);
    }

    clone(): Item {
        return new StonePickaxe(this.world);
    }

    icon(): string {
        return itemIcon;
    }

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

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
registerClass(StonePickaxe);
