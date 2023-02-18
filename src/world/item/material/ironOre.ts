/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/ironOre.png';
import meshUrl from '../../../../assets/vox/items/ironOre.vox?url';
import { StackableItem } from '../stackableItem';

export class IronOre extends StackableItem {
    constructor(world: World, amount = 1) {
        super(world, amount, 'Iron Ore');
    }

    icon(): string {
        return itemIcon;
    }

    attackDamage(e: Entity): number {
        return 2;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
