import { TriangleMesh, VoxelMesh } from '../../../render/meshes';
import { Entity } from '../../entity/entity';
import { World } from '../../world';
import { Item } from '../item';

import itemIcon from '../../../../assets/gfx/items/branch.png';

export class Branch extends Item {
    constructor(world: World) {
        super(world, 'Branch');
    }

    icon(): string {
        return itemIcon;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.meshes.branch;
    }
}
