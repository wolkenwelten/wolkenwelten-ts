/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../../../game';
import { Inventory } from '../../../world/item/inventory';
import { Div } from '../../utils';
import styles from './inventoryRow.module.css';
import { InventorySlotWidget } from './inventorySlotWidget';

export class InventoryRow {
    div: HTMLElement;
    inventory: Inventory;
    offset: number;
    slots: InventorySlotWidget[] = [];

    constructor(
        parent: HTMLElement,
        inventory: Inventory,
        offset = 0,
        game: Game,
        showActive = true
    ) {
        parent.appendChild((this.div = Div({ class: styles.row })));
        this.inventory = inventory;
        this.offset = offset;
        for (let i = 0; i < 10; i++) {
            this.slots.push(
                new InventorySlotWidget(
                    this.div,
                    inventory,
                    i + offset,
                    game,
                    showActive
                )
            );
        }
    }

    update(i: number) {
        if (i >= 0) {
            this.slots[i - this.offset]?.update();
        } else {
            for (let ni = 0; ni < this.slots.length; ni++) {
                this.slots[ni].update();
            }
        }
    }
}
