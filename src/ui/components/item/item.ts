/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Item, MaybeItem } from '../../../world/item/item';
import { StackableItem } from '../../../world/item/stackableItem';
import styles from './item.module.css';

export class ItemWidget {
    div: HTMLElement;
    amount: HTMLElement;
    img: HTMLImageElement;

    constructor(parent: HTMLElement, showActive = true) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.slot);

        this.img = document.createElement('img');
        this.img.classList.add(styles.img);
        if (showActive) {
            this.img.classList.add(styles.showActive);
        }
        this.div.appendChild(this.img);

        this.amount = document.createElement('div');
        this.amount.classList.add(styles.amount);
        this.div.appendChild(this.amount);

        this.update(undefined);
        parent.appendChild(this.div);
    }

    update(item: MaybeItem, active = false) {
        const name = item?.name || '';

        if (active) {
            this.div.classList.add(styles.active);
        } else {
            this.div.classList.remove(styles.active);
        }
        if (name) {
            this.div.setAttribute('title', name);
        } else {
            this.div.removeAttribute('title');
        }
        if (item instanceof StackableItem) {
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
                this.img.style.display = 'none';
            }
        } else if (item instanceof Item) {
            const icon = item.icon();
            if (icon) {
                this.img.setAttribute('src', icon);
                this.img.style.display = 'block';
            } else {
                this.img.style.display = 'none';
            }
            this.amount.innerText = '';
        } else {
            this.amount.innerText = '';
            this.img.style.display = 'none';
        }
    }
}
