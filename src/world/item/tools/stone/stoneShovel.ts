import { TriangleMesh, VoxelMesh } from '../../../../render/meshes';
import { Entity } from '../../../entity/entity';
import { World } from '../../../world';

import itemIcon from '../../../../../assets/gfx/items/tools/stoneShovel.png';
import { Item } from '../../item';

export class StoneShovel extends Item {
    constructor(world: World) {
        super(world, 'Stone Shovel');
    }

    icon(): string {
        return itemIcon;
    }

    attackDamage(e: Entity): number {
        return 4;
    }

    miningDamage(block: number): number {
        return this.world.blocks[block].miningCat === 'Shovel' ? 3 : 1;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.meshes.stoneShovel;
    }
}
