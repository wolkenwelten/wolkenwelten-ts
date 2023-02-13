import { TriangleMesh, VoxelMesh } from '../../render/meshes';
import { Entity } from '../entity/entity';
import { ItemDrop } from '../entity/itemDrop';
import { World } from '../world';
import { Inventory } from './inventory';

import itemIcon from '../../../assets/gfx/items/rawCrabMeat.png';

export type MaybeItem = Item | undefined;

export class Item {
    name: string;
    world: World;
    destroyed = false;

    constructor(world: World, name: string) {
        this.name = name;
        this.world = world;
    }

    clone(): Item {
        return new Item(this.world, this.name);
    }

    destroy() {
        this.destroyed = true;
    }

    icon(): string {
        return itemIcon;
    }

    use(e: Entity): boolean {
        return false;
    }

    miningDamage(block: number): number {
        return 1;
    }

    drop(e: Entity): boolean {
        const drop = new ItemDrop(e.world, e.x, e.y, e.z, this);
        const [vx, vz] = e.walkDirection();
        drop.vy = 0.01;
        drop.vx = vx * -0.1;
        drop.vz = vz * -0.1;
        drop.noCollect = true;
        return true;
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.meshes.bag;
    }

    addToExistingStacks(inventory: Inventory) {}
}
