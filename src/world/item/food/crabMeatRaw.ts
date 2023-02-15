import { TriangleMesh, VoxelMesh } from '../../../render/meshes';
import { Entity } from '../../entity/entity';
import { World } from '../../world';

import itemIcon from '../../../../assets/gfx/items/rawCrabMeat.png';
import { Character } from '../../entity/character';
import { StackableItem } from '../stackableItem';

export class CrabMeatRaw extends StackableItem {
    constructor(world: World, amount = 1) {
        super(world, 'Crab meat', amount);
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
            if (--this.amount <= 0) {
                this.destroy();
            }
            return true;
        }
        return false;
    }
}
