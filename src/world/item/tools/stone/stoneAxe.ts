import { TriangleMesh, VoxelMesh } from '../../../../render/meshes';
import { Entity } from '../../../entity/entity';
import { World } from '../../../world';

import itemIcon from '../../../../../assets/gfx/items/tools/stoneAxe.png';
import { Item } from '../../item';

export class StoneAxe extends Item {
    constructor(world: World) {
        super(world, 'Stone Axe');
    }

    icon(): string {
        return itemIcon;
    }

    attackDamage(e: Entity): number {
        return 4;
    }

    miningDamage(block: number): number {
        return this.world.blocks[block].miningCat === 'Axe' ? 3 : 1;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.meshes.stoneAxe;
    }
}
