/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/ironBar.png';
import meshUrl from '../../../../assets/vox/items/ironBar.vox?url';
import { StackableItem } from '../stackableItem';
import { registerClass } from '../../../class';

export class IronBar extends StackableItem {
    constructor(world: World, amount = 1) {
        super(world, amount, 'Iron Bar');
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
registerClass(IronBar);
