/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Item, MaybeItem } from '../../../world/item/item';
import { StackableItem } from '../../../world/item/stackableItem';
import { Skill } from '../../../world/skill/skill';
import { HotbarEntryValue } from '../hotbar/hotbar';
import styles from './item.module.css';

export class ItemWidget {
    div: HTMLElement;
    amount: HTMLElement;
    img: HTMLImageElement;

    wasActive = false;
    lastName = '';
    lastAmount = 0;
    lastIcon = '';

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

    update(item: HotbarEntryValue, active = false) {
        const name = item?.name || '';

        if (active) {
            if (!this.wasActive) {
                this.div.classList.add(styles.active);
                this.wasActive = true;
            }
        } else if (this.wasActive) {
            this.div.classList.remove(styles.active);
            this.wasActive = false;
        }
        if (name) {
            if (name !== this.lastName) {
                this.div.setAttribute('title', name);
                this.lastName = name;
            }
        } else {
            this.div.removeAttribute('title');
            this.lastName = '';
        }
        if (item instanceof StackableItem) {
            if (item.amount > 0) {
                if (item.amount !== this.lastAmount) {
                    this.amount.innerText = `${item.amount}`;
                    this.lastAmount = item.amount;
                }
            } else {
                this.amount.innerText = '';
                this.lastAmount = 0;
            }
            const icon = item.icon();
            if (icon) {
                if (icon !== this.lastIcon) {
                    this.img.setAttribute('src', icon);
                    this.img.style.display = 'block';
                    this.lastIcon = icon;
                }
            } else {
                this.img.style.display = 'none';
                this.lastIcon = '';
            }
        } else if (item instanceof Item) {
            const icon = item.icon();
            if (icon) {
                if (icon !== this.lastIcon) {
                    this.img.setAttribute('src', icon);
                    this.img.style.display = 'block';
                    this.lastIcon = icon;
                }
            } else {
                this.img.style.display = 'none';
                this.lastIcon = '';
            }
            this.amount.innerText = '';
            this.lastAmount = 0;
        } else if (item instanceof Skill) {
            const icon = item.icon;
            if (icon) {
                if (icon !== this.lastIcon) {
                    this.img.setAttribute('src', icon);
                    this.img.style.display = 'block';
                    this.lastIcon = icon;
                }
            } else {
                this.img.style.display = 'none';
                this.lastIcon = '';
            }
            this.amount.innerText = '';
            this.lastAmount = 0;
        } else {
            this.amount.innerText = '';
            this.img.style.display = 'none';
            this.lastAmount = 0;
            this.lastIcon = '';
        }
    }
}
