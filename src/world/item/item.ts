import { Entity } from '../entity/entity';
import { ItemDrop } from '../entity/itemDrop';
import { Inventory } from './inventory';

export type MaybeItem = Item | undefined;

export class Item {
    name: string;
    destroyed = false;

    constructor(name: string) {
        this.name = name;
    }

    destroy() {
        this.destroyed = true;
    }

    use(e: Entity): boolean {
        return false;
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

    addToExistingStacks(inventory: Inventory) {}
}
