/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
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

    mayPut(index: number, item: Item): boolean {
        return true;
    }

    add(item: Item): boolean {
        this.addItemToExistingStacks(item);
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

    remove(item: Item): boolean {
        let left = item.amount;
        for (let i = 0; i < this.items.length; i++) {
            const c = this.items[i];
            if (c && c.mayStackWith(item) && item.mayStackWith(c)) {
                c.amount -= left;
                if (c.amount < 0) {
                    left = -c.amount;
                    c.destroy();
                    this.items[i] = undefined;
                } else {
                    if (c.amount === 0) {
                        c.destroy();
                        this.items[i] = undefined;
                    }
                    return true;
                }
            }
        }
        return false;
    }

    clear() {
        for (let i = 0; i < this.items.length; i++) {
            this.items[i] = undefined;
        }
    }

    countItem(item: Item): number {
        let acc = 0;
        for (let i = 0; i < this.items.length; i++) {
            const c = this.items[i];
            if (
                c &&
                c.constructor === item.constructor &&
                c.mayStackWith(item) &&
                item.mayStackWith(c)
            ) {
                acc += c.amount;
            }
        }
        return Math.floor(acc / item.amount);
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

    addItemToExistingStacks(source: Item) {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (!item) {
                continue;
            }
            if (
                item.amount >= item.stackSize ||
                !source.mayStackWith(item) ||
                !item.mayStackWith(source)
            ) {
                continue;
            }

            const spaceLeft = item.stackSize + 1 - item.amount;
            if (spaceLeft > source.amount) {
                item.amount += source.amount;
                source.destroy();
                return;
            } else {
                source.amount += spaceLeft;
                item.amount -= spaceLeft;
            }
        }
    }
}
