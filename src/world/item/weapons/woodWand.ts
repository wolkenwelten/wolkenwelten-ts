/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/woodWand.png';
import meshUrl from '../../../../assets/vox/items/woodWand.vox?url';
import { Item } from '../item';
import { Character } from '../../character';
import { registerClass } from '../../../class';

export class WoodWand extends Item {
    attackSkill = ['clubmanship', 'onehanded'];
    isWeapon = true;

    constructor(world: World, name = 'Wood wand') {
        super(world, name);
    }

    clone(): Item {
        return new WoodWand(this.world);
    }

    icon(): string {
        return itemIcon;
    }

    attackDamage(e: Entity): number {
        return 2;
    }

    attackCooldown(e: Entity): number {
        let multiplier = 1;
        if (e instanceof Character) {
            multiplier -= e.skillLevel('clubmanship') * 0.1;
            multiplier -= e.skillLevel('onehanded') * 0.03;
        }
        return 60 * multiplier;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
registerClass(WoodWand);
