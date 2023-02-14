import { TriangleMesh, VoxelMesh } from '../../../render/meshes';
import { Entity } from '../../entity/entity';
import { World } from '../../world';
import { Item } from '../item';

import itemIcon from '../../../../assets/gfx/items/rawCrabMeat.png';
import { Character } from '../../entity/character';

export class CrabMeatRaw extends Item {
    constructor(world: World) {
        super(world, 'Crab meat');
    }

    icon(): string {
        return itemIcon;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.meshes.crabMeatRaw;
    }

    use(e: Entity): boolean {
        if (this.destroyed) {
            return false;
        }
        if (e instanceof Character) {
            if (this.world.game.ticks < e.lastAction) {
                return false;
            }
            if (e.health === e.maxHealth) {
                return false;
            }
            e.cooldown(100);
            e.heal(4);
            this.world.game.audio.play('chomp', 0.5);
            this.destroy();
            return true;
        }
        return false;
    }
}
