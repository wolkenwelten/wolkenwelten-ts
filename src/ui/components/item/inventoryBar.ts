import styles from './inventoryBar.module.css';
import { InventorySlot } from './inventorySlot';

export class InventoryBar {
    div: HTMLElement;

    constructor(parent: HTMLElement) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.bar);
        for (let i = 0; i < 10; i++) {
            new InventorySlot(this.div);
        }
        parent.appendChild(this.div);
    }
}
