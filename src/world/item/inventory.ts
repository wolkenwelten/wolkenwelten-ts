import { Item, MaybeItem } from './item';

export class Inventory {
    items: MaybeItem[];
    selection = -1;
    onChange?: (i: number) => void;

    constructor(size: number) {
        this.items = [];
        this.items.length = size;
    }

    active(): MaybeItem {
        return this.items[this.selection];
    }

    add(item: Item): boolean {
        item.addToExistingStacks(this);
        if (item.destroyed) {
            this.onChange && this.onChange(-1);
            return true;
        }
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i] === undefined) {
                this.items[i] = item;
                this.onChange && this.onChange(-1);
                return true;
            }
        }
        return false;
    }

    clear() {
        for (let i = 0; i < this.items.length; i++) {
            this.items[i] = undefined;
        }
    }

    select(newSelection: number) {
        this.selection = newSelection;
        this.onChange && this.onChange(-1);
    }

    updateAll() {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i]?.destroyed) {
                this.items[i] = undefined;
            }
        }
        this.onChange && this.onChange(-1);
    }
}
