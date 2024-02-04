/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { HotbarEntryValue } from '../hotbar/hotbar';
import { Item } from '../../../world/item/item';
import { Div, Img } from '../../utils';
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
		parent.appendChild(
			(this.div = Div({
				class: styles.slot,
				children: [
					(this.img = Img({ class: styles.img })),
					(this.amount = Div({ class: styles.amount })),
				],
			}))
		);
		if (showActive) {
			this.img.classList.add(styles.showActive);
		}
		this.update(undefined);
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
		if (item instanceof Item) {
			if (item.stackSize > 1 && item.amount > 0) {
				if (item.amount !== this.lastAmount) {
					this.amount.innerText = `${item.amount}`;
					this.lastAmount = item.amount;
				}
			} else {
				this.amount.innerText = '';
				this.lastAmount = 0;
			}
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
		} else {
			this.amount.innerText = '';
			this.img.style.display = 'none';
			this.lastAmount = 0;
			this.lastIcon = '';
		}
	}
}
