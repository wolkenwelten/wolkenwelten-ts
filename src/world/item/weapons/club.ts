/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../../render/asset';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/club.png';
import meshUrl from '../../../../assets/vox/items/club.vox?url';
import { Item } from '../item';
import { Character } from '../../character';
import { registerClass } from '../../../class';

export class Club extends Item {
    attackSkill = ['clubmanship', 'onehanded'];
    isWeapon = true;

    constructor(world: World, name = 'Club') {
        super(world, name);
    }

    clone(): Item {
        return new Club(this.world);
    }

    icon(): string {
        return itemIcon;
    }

    attackDamage(e: Entity): number {
        return 5;
    }

    attackCooldown(e: Entity): number {
        let multiplier = 1;
        if (e instanceof Character) {
            multiplier -= e.skillLevel('clubmanship') * 0.1;
            multiplier -= e.skillLevel('onehanded') * 0.03;
        }
        return 70 * multiplier;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.get(meshUrl);
    }
}
registerClass(Club);
