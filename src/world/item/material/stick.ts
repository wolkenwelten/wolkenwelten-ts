import { TriangleMesh, VoxelMesh } from '../../../render/meshes';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/stick.png';
import { StackableItem } from '../stackableItem';

export class Stick extends StackableItem {
    constructor(world: World, amount = 1) {
        super(world, 'Stick', amount);
    }

    icon(): string {
        return itemIcon;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.meshes.stick;
    }
}
