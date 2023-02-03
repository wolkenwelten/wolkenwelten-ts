import { Item, MaybeItem } from './item';

export class Inventory {
    items: MaybeItem[];

    constructor(size: number) {
        this.items = [];
        this.items.length = size;
    }

    push(item: Item): boolean {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i] === undefined) {
                this.items[i] = item;
                return true;
            }
        }
        return false;
    }
}
