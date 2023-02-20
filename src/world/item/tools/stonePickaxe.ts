/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/stonePickaxe.png';
import meshUrl from '../../../../assets/vox/items/stonePickaxe.vox?url';
import { Item } from '../item';

export class StonePickaxe extends Item {
    constructor(world: World) {
        super(world, 'Stone Pickaxe');
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

    miningDamage(block: number): number {
        return this.world.blocks[block].miningCat === 'Pickaxe' ? 3 : 0;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
