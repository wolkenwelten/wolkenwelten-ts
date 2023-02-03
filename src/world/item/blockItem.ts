import { blocks } from '../blockType/blockType';
import { Entity } from '../entity/entity';
import { Inventory } from './inventory';
import { Item } from './item';

export class BlockItem extends Item {
    blockType: number;
    amount: number;

    constructor(blockType: number, amount: number) {
        const bt = blocks[blockType];
        if (!bt) {
            throw new Error(`Invalid blockType: ${blockType}`);
        }
        super(bt.name);

        this.blockType = blockType;
        this.amount = amount;
    }

    use(e: Entity): boolean {
        if (this.destroyed) {
            return false;
        }
        const ray = e.raycast(true);
        if (!ray) {
            return false;
        }
        const [x, y, z] = ray;
        e.world.setBlock(x, y, z, this.blockType);
        if (--this.amount <= 0) {
            this.destroy();
        }

        e.cooldown(20);
        return true;
    }

    addToExistingStacks(inventory: Inventory) {
        for (let i = 0; i < inventory.items.length; i++) {
            const item = inventory.items[i];
            if (!item || !(item instanceof BlockItem)) {
                continue;
            }
            if (item.amount >= 99 || item.blockType !== this.blockType) {
                continue;
            }

            const spaceLeft = 99 - item.amount;
            if (spaceLeft > this.amount) {
                item.amount += this.amount;
                this.destroy();
                return;
            } else {
                this.amount += spaceLeft;
                item.amount -= spaceLeft;
            }
        }
    }
}
