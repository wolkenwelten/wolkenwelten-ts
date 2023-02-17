/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { BlockItem } from './blockItem';
import { Item, MaybeItem } from './item';
import { StackableItem } from './stackableItem';

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

    remove(item: Item): boolean {
        if (item instanceof BlockItem) {
            let left = item.amount;
            for (let i = 0; i < this.items.length; i++) {
                const c = this.items[i];
                if (c instanceof BlockItem && c.blockType === item.blockType) {
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
        } else if (item instanceof StackableItem) {
            let left = item.amount;
            for (let i = 0; i < this.items.length; i++) {
                const c = this.items[i];
                if (
                    c instanceof StackableItem &&
                    c.mayStackWith(item) &&
                    item.mayStackWith(c)
                ) {
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
        } else {
            for (let i = 0; i < this.items.length; i++) {
                const c = this.items[i];
                if (c && c.constructor === item.constructor) {
                    c.destroy();
                    this.items[i] = undefined;
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
            if (c && c.constructor === item.constructor) {
                if (c instanceof BlockItem) {
                    if (
                        item instanceof BlockItem &&
                        c.blockType === item.blockType
                    ) {
                        acc += c.amount;
                    }
                } else if (c instanceof StackableItem) {
                    acc += c.amount;
                } else {
                    acc++;
                }
            }
        }
        if (item instanceof StackableItem) {
            return Math.floor(acc / item.amount);
        } else {
            return acc;
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
