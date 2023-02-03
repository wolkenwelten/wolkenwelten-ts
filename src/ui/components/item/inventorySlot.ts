import { BlockItem } from '../../../world/item/blockItem';
import { MaybeItem } from '../../../world/item/item';
import styles from './inventorySlot.module.css';

export class InventorySlot {
    div: HTMLElement;
    name: HTMLElement;
    amount: HTMLElement;

    constructor(parent: HTMLElement, item: MaybeItem, active: boolean) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.slot);

        this.name = document.createElement('div');
        this.name.classList.add(styles.name);
        this.div.appendChild(this.name);

        this.amount = document.createElement('div');
        this.amount.classList.add(styles.amount);
        this.div.appendChild(this.amount);

        this.update(item, active);
        parent.appendChild(this.div);
    }

    update(item: MaybeItem, active: boolean) {
        this.name.innerText = item?.name || '';
        if (active) {
            this.div.classList.add(styles.active);
        } else {
            this.div.classList.remove(styles.active);
        }
        if (item instanceof BlockItem) {
            if (item.amount > 0) {
                this.amount.innerText = `${item.amount}`;
            } else {
                this.amount.innerText = '';
            }
        } else {
            this.amount.innerText = '';
        }
    }
}
