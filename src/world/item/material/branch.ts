import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/branch.png';
import meshUrl from '../../../../assets/vox/items/branch.vox?url';
import { StackableItem } from '../stackableItem';

export class Branch extends StackableItem {
    constructor(world: World, amount = 1) {
        super(world, amount, 'Branch');
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
