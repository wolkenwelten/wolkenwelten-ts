/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/stick.png';
import meshUrl from '../../../../assets/vox/items/stick.vox?url';
import { StackableItem } from '../stackableItem';

export class Stick extends StackableItem {
    attackSkill = ['onehanded'];

    constructor(world: World, amount = 1) {
        super(world, amount, 'Stick');
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
