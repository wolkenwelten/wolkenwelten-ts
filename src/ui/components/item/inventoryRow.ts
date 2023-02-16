import { Game } from '../../../game';
import { Inventory } from '../../../world/item/inventory';
import styles from './inventoryRow.module.css';
import { InventorySlot } from './inventorySlot';

export class InventoryRow {
    div: HTMLElement;
    inventory: Inventory;
    offset: number;
    slots: InventorySlot[] = [];

    constructor(
        parent: HTMLElement,
        inventory: Inventory,
        offset = 0,
        game: Game
    ) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.row);
        this.inventory = inventory;
        this.offset = offset;
        for (let i = 0; i < 10; i++) {
            this.slots.push(
                new InventorySlot(this.div, inventory, i + offset, game)
            );
        }
        parent.appendChild(this.div);
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
