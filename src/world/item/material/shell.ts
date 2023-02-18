/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/shell.png';
import meshUrl from '../../../../assets/vox/items/shell.vox?url';
import { StackableItem } from '../stackableItem';

export class Shell extends StackableItem {
    constructor(world: World, amount = 1) {
        super(world, amount, 'Shell');
    }

    icon(): string {
        return itemIcon;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
