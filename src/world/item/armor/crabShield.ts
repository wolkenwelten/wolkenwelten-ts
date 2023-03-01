/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/crabShield.png';
import meshUrl from '../../../../assets/vox/items/crabShield.vox?url';
import { Item } from '../item';
import { registerClass } from '../../../class';

export class CrabShield extends Item {
    isShield = true;

    constructor(world: World, name = 'Crab shield') {
        super(world, name);
    }

    clone(): Item {
        return new CrabShield(this.world);
    }

    icon(): string {
        return itemIcon;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
registerClass(CrabShield);
