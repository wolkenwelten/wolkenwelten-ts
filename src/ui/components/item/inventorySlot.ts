/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Inventory } from '../../../world/item/inventory';
import { ItemWidget } from './item';
import styles from './inventorySlot.module.css';
import { Game } from '../../../game';
import { StackableItem } from '../../../world/item/stackableItem';
import { Item } from '../../../world/item/item';

export class InventorySlot {
    div: HTMLElement;
    inventory: Inventory;
    slotIndex: number;
    game: Game;
    widget: ItemWidget;
    showActive: boolean;

    constructor(
        parent: HTMLElement,
        inventory: Inventory,
        slotIndex: number,
        game: Game,
        showActive = true,
        additionalClass?: string
    ) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.slot);
        if (additionalClass) {
            this.div.classList.add(additionalClass);
        }
        this.showActive = showActive;

        this.widget = new ItemWidget(this.div, showActive);

        this.inventory = inventory;
        this.slotIndex = slotIndex;

        this.div.addEventListener('mousedown', (e) => e.stopPropagation());
        this.div.addEventListener('click', this.click.bind(this));
        this.div.addEventListener('contextmenu', this.rightClick.bind(this));

        this.game = game;

        this.update();
        parent.appendChild(this.div);
    }

    rightClick(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (this.game.ui.heldItem === undefined) {
            const item = this.inventory.items[this.slotIndex];
            if (item instanceof StackableItem) {
                if (item.amount < 2) {
                    this.game.ui.heldItem =
                        this.inventory.items[this.slotIndex];
                    this.inventory.items[this.slotIndex] = undefined;
                } else {
                    const newStack = item.clone();
                    newStack.amount = Math.ceil(newStack.amount / 2);
                    item.amount -= newStack.amount;
                    this.game.ui.heldItem = newStack;
                }
            } else {
                const item = this.inventory.items[this.slotIndex];
                if (item) {
                    if (item.isWeapon) {
                        const t = this.game.player.equipment.items[0];
                        this.game.player.equipment.items[0] = item;
                        this.inventory.items[this.slotIndex] = t;
                    } else if (item.isShield) {
                        const t = this.game.player.equipment.items[1];
                        this.game.player.equipment.items[1] = item;
                        this.inventory.items[this.slotIndex] = t;
                    } else if (item.isHeadwear) {
                        const t = this.game.player.equipment.items[2];
                        this.game.player.equipment.items[2] = item;
                        this.inventory.items[this.slotIndex] = t;
                    } else if (item.isTorsowear) {
                        const t = this.game.player.equipment.items[3];
                        this.game.player.equipment.items[3] = item;
                        this.inventory.items[this.slotIndex] = t;
                    } else if (item.isTorsowear) {
                        const t = this.game.player.equipment.items[4];
                        this.game.player.equipment.items[4] = item;
                        this.inventory.items[this.slotIndex] = t;
                    } else if (item.isLegwear) {
                        const t = this.game.player.equipment.items[5];
                        this.game.player.equipment.items[5] = item;
                        this.inventory.items[this.slotIndex] = t;
                    } else if (item.isFootwear) {
                        const t = this.game.player.equipment.items[6];
                        this.game.player.equipment.items[6] = item;
                        this.inventory.items[this.slotIndex] = t;
                    } else {
                        this.game.ui.heldItem =
                            this.inventory.items[this.slotIndex];
                        this.inventory.items[this.slotIndex] = undefined;
                    }
                }
            }
        } else {
            const a = this.game.ui.heldItem;
            const b = this.inventory.items[this.slotIndex];
            if (a instanceof StackableItem) {
                if (b instanceof StackableItem) {
                    if (
                        a.mayStackWith(b) &&
                        b.mayStackWith(a) &&
                        b.amount < 99
                    ) {
                        a.amount--;
                        b.amount++;
                    }
                } else if (b === undefined) {
                    if (this.inventory.mayPut(this.slotIndex, a)) {
                        const newStack = a.clone();
                        newStack.amount = 1;
                        a.amount--;
                        this.inventory.items[this.slotIndex] = newStack;
                    }
                }
                if (a.amount < 1) {
                    a.destroy();
                    this.game.ui.heldItem = undefined;
                }
            } else if (a instanceof Item) {
                if (this.inventory.mayPut(this.slotIndex, a)) {
                    this.inventory.items[this.slotIndex] = a;
                    this.game.ui.heldItem = b;
                }
            }
        }

        this.game.ui.cursorItem.update(this.game.ui.heldItem);
        this.game.ui.cursorItem.updatePos(e.pageX, e.pageY);
        this.game.ui.updateInventory(this.slotIndex);
        this.update();
    }

    click(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (this.game.ui.heldItem === undefined) {
            const tmp = this.inventory.items[this.slotIndex];
            this.inventory.items[this.slotIndex] = this.game.ui.heldItem;
            this.game.ui.heldItem = tmp;
        } else {
            const a = this.game.ui.heldItem;
            const b = this.inventory.items[this.slotIndex];
            if (
                a instanceof StackableItem &&
                b instanceof StackableItem &&
                a.mayStackWith(b) &&
                b.mayStackWith(a)
            ) {
                const transfer = Math.min(a.amount, 99 - b.amount);
                a.amount -= transfer;
                b.amount += transfer;
                if (a.amount === 0) {
                    a.destroy();
                    this.game.ui.heldItem = undefined;
                }
            } else if (a instanceof Item) {
                if (this.inventory.mayPut(this.slotIndex, a)) {
                    this.inventory.items[this.slotIndex] = a;
                    this.game.ui.heldItem = b;
                }
            }
        }

        this.game.ui.cursorItem.update(this.game.ui.heldItem);
        this.game.ui.cursorItem.updatePos(e.pageX, e.pageY);
        this.game.ui.updateInventory(this.slotIndex);
        this.update();
    }

    update() {
        const item = this.inventory.items[this.slotIndex];
        const active =
            this.showActive && this.inventory.selection === this.slotIndex;
        if (active) {
            this.div.classList.add(styles.active);
        } else {
            this.div.classList.remove(styles.active);
        }
        this.widget.update(item, active);
    }
}
