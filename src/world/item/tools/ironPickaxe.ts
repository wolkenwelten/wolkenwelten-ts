/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/ironPickaxe.png';
import meshUrl from '../../../../assets/vox/items/ironPickaxe.vox?url';
import { Item } from '../item';

export class IronPickaxe extends Item {
    constructor(world: World) {
        super(world, 'Iron Pickaxe');
    }

    clone(): Item {
        return new IronPickaxe(this.world);
    }

    icon(): string {
        return itemIcon;
    }

    attackDamage(e: Entity): number {
        return 8;
    }

    miningDamage(block: number): number {
        return this.world.blocks[block].miningCat === 'Pickaxe' ? 7 : 1;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}