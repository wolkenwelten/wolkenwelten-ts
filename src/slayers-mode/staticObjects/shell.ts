/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import meshUrl from '../assets/vox/staticShell.vox?url';

import { Entity, Item, ItemDrop, StaticObject, VoxelMesh } from '../../engine';

export class StaticShell extends StaticObject {
    mesh(): VoxelMesh {
        return this.chunk.world.game.render.assets.get(meshUrl);
    }

    onAttacked(perpetrator: Entity) {
        const item = Item.create('shell', this.chunk.world, 1);
        new ItemDrop(
            this.chunk.world,
            this.x + 0.5,
            this.y + 0.5,
            this.z + 0.5,
            item
        );
        this.destroy();
    }

    transOff(): [number, number, number] {
        return [0.5 - 6 / 32, 1 / 32, 0.5 + 4 / 32];
    }
}
