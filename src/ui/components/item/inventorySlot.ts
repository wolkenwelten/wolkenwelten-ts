import { BlockItem } from '../../../world/item/blockItem';
import { Item, MaybeItem } from '../../../world/item/item';
import styles from './inventorySlot.module.css';

export class InventorySlot {
    div: HTMLElement;
    name: HTMLElement;
    amount: HTMLElement;
    img: HTMLImageElement;

    constructor(parent: HTMLElement, item: MaybeItem, active: boolean) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.slot);

        this.img = document.createElement('img');
        this.img.classList.add(styles.img);
        this.div.appendChild(this.img);

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
        const name = item?.name || '';
        this.name.innerText = name;
        if (name) {
            this.div.setAttribute('title', name);
        } else {
            this.div.removeAttribute('title');
        }
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
            const icon = item.icon();
            if (icon) {
                this.img.setAttribute('src', icon);
                this.img.style.display = 'block';
            } else {
                this.amount.innerText = '';
                this.img.style.display = 'none';
            }
        } else if (item instanceof Item) {
            const icon = item.icon();
            if (icon) {
                this.img.setAttribute('src', icon);
                this.img.style.display = 'block';
            } else {
                this.amount.innerText = '';
                this.img.style.display = 'none';
            }
        } else {
            this.amount.innerText = '';
            this.img.style.display = 'none';
        }
    }
}
