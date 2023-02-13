import { TriangleMesh, VoxelMesh } from '../../../render/meshes';
import { Entity } from '../../entity/entity';
import { World } from '../../world';
import { Item } from '../item';

import itemIcon from '../../../../assets/gfx/items/stick.png';
import itemIcon2 from '../../../../assets/gfx/items/stick2.png';

export class Stick extends Item {
    constructor(world: World) {
        super(world, 'Stick');
    }

    icon(): string {
        return (this.id & 1) === 0 ? itemIcon : itemIcon2;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.meshes.stick;
    }
}
