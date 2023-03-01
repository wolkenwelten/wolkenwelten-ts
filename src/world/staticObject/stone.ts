/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { VoxelMesh } from '../../render/asset';
import { StaticObject } from './staticObject';
import meshUrl from '../../../assets/vox/stone.vox?url';
import { Entity } from '../entity/entity';
import { ItemDrop } from '../item/itemDrop';
import { Stone } from '../item/material/stone';
import { registerClass } from '../../class';

export class StaticStone extends StaticObject {
    mesh(): VoxelMesh {
        return this.chunk.world.game.render.assets.get(meshUrl);
    }

    onAttacked(perpetrator: Entity) {
        const item = new Stone(this.chunk.world, 1);
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
        return [0.5 - 3 / 32, 1 / 32, 0.5 + 5 / 32];
    }
}
registerClass(StaticStone);
