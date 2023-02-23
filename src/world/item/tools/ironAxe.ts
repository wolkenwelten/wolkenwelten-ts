/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/ironAxe.png';
import meshUrl from '../../../../assets/vox/items/ironAxe.vox?url';
import { Item } from '../item';
import { Character } from '../../entity/character';
import { StoneAxe } from './stoneAxe';

export class IronAxe extends StoneAxe {
    attackSkill = ['axefighting', 'onehanded'];

    constructor(world: World) {
        super(world, 'Iron Axe');
    }

    clone(): Item {
        return new IronAxe(this.world);
    }

    icon(): string {
        return itemIcon;
    }

    attackDamage(e: Entity): number {
        return 8;
    }

    miningDamage(block: number): number {
        return this.world.blocks[block].miningCat === 'Axe' ? 7 : 0;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
