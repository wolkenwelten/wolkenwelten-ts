import styles from './inventorySlot.module.css';

export class InventorySlot {
    div: HTMLElement;

    constructor(parent: HTMLElement) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.slot);
        parent.appendChild(this.div);
    }
}
