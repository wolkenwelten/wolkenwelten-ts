/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/stoneAxe.png';
import meshUrl from '../../../../assets/vox/items/stoneAxe.vox?url';
import { Item } from '../item';
import { Character } from '../../entity/character';

export class StoneAxe extends Item {
    attackSkill = ['axefighting', 'onehanded'];

    constructor(world: World, name = 'Stone Axe') {
        super(world, name);
    }

    clone(): Item {
        return new StoneAxe(this.world);
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
        return this.world.blocks[block].miningCat === 'Axe' ? 3 : 0;
    }

    onMineWith(e: Entity, block: number): void {
        if (e instanceof Character) {
            e.skillXpGain('axefighting', 1);
        }
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
