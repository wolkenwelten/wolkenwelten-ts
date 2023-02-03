import { Entity } from './entity';
import { World } from '../world';
import { Item } from '../item/item';

export class ItemDrop extends Entity {
    item: Item;

    constructor(world: World, x: number, y: number, z: number, item: Item) {
        super(world);

        this.x = x;
        this.y = y;
        this.z = z;
        this.item = item;
    }

    update() {
        Entity.prototype.update.call(this);
        const player = this.world.game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dz = player.z - this.z;
        const dd = dx * dx + dy * dy + dz * dz;
        if (dd < 2.5 * 2.5) {
            if (player.inventory.push(this.item)) {
                this.destroy();
            }
        }
    }
}
