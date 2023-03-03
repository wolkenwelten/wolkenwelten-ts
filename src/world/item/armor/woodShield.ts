/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/woodShield.png';
import meshUrl from '../../../../assets/vox/items/woodShield.vox?url';
import { Item } from '../item';
import { registerClass } from '../../../class';

export class WoodShield extends Item {
    isShield = true;

    constructor(world: World, name = 'Wood shield') {
        super(world, name);
    }

    clone(): Item {
        return new WoodShield(this.world);
    }

    icon(): string {
        return itemIcon;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
registerClass(WoodShield);
