import { TriangleMesh, VoxelMesh } from '../../../render/meshes';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/branch.png';
import { StackableItem } from '../stackableItem';

export class Branch extends StackableItem {
    constructor(world: World, amount = 1) {
        super(world, 'Branch', amount);
    }

    icon(): string {
        return itemIcon;
    }

    attackDamage(e: Entity): number {
        return 2;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.meshes.branch;
    }
}
