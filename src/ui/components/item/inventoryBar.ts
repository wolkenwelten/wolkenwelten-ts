import { Inventory } from '../../../world/item/inventory';
import styles from './inventoryBar.module.css';
import { InventorySlot } from './inventorySlot';

export class InventoryBar {
    div: HTMLElement;

    constructor(parent: HTMLElement, inventory: Inventory) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.bar);
        const slots: InventorySlot[] = [];
        for (let i = 0; i < 10; i++) {
            slots.push(
                new InventorySlot(
                    this.div,
                    inventory.items[i],
                    inventory.selection === i
                )
            );
        }
        inventory.onChange = (i: number) => {
            if (i >= 0) {
                slots[i].update(inventory.items[i], inventory.selection === i);
            } else {
                for (let ni = 0; ni < slots.length; ni++) {
                    slots[ni].update(
                        inventory.items[ni],
                        inventory.selection === ni
                    );
                }
            }
        };
        parent.appendChild(this.div);
    }
}
