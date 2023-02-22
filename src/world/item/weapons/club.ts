/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/club.png';
import meshUrl from '../../../../assets/vox/items/club.vox?url';
import { Item } from '../item';

export class Club extends Item {
    constructor(world: World) {
        super(world, 'Club');
    }

    clone(): Item {
        return new Club(this.world);
    }

    icon(): string {
        return itemIcon;
    }

    attackDamage(e: Entity): number {
        return 4;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}