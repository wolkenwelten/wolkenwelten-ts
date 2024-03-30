/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../../../game";
import type { Inventory } from "../../../world/item/inventory";
import { Item } from "../../../world/item/item";
import { Div } from "../../utils";
import styles from "./inventorySlotWidget.module.css";
import { ItemWidget } from "./item";

export class InventorySlotWidget {
	div: HTMLElement;
	inventory: Inventory;
	slotIndex: number;
	game: Game;
	widget: ItemWidget;
	showActive: boolean;

	constructor(
		parent: HTMLElement,
		inventory: Inventory,
		slotIndex: number,
		game: Game,
		showActive = true,
		additionalClass?: string,
	) {
		this.game = game;
		parent.appendChild(
			(this.div = Div({
				class: styles.slot,
				onMousedown: (e) => e.stopPropagation(),
				onClick: this.click.bind(this),
				onContextmenu: this.rightClick.bind(this),
			})),
		);
		if (additionalClass) {
			this.div.classList.add(additionalClass);
		}
		this.showActive = showActive;
		this.widget = new ItemWidget(this.div, showActive);
		this.inventory = inventory;
		this.slotIndex = slotIndex;
		this.update();
	}

	rightClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const a = this.game.ui.heldItem;
		if (!a) {
			const item = this.inventory.items[this.slotIndex];
			if (item) {
				if (item.amount >= 2) {
					const newStack = item.clone();
					newStack.amount = Math.ceil(newStack.amount / 2);
					item.amount -= newStack.amount;
					this.game.ui.heldItem = newStack;
				} else if (item.isWeapon) {
					const t = this.game.player.equipment.items[0];
					this.game.player.equipment.items[0] = item;
					this.inventory.items[this.slotIndex] = t;
				} else {
					this.game.ui.heldItem = this.inventory.items[this.slotIndex];
					this.inventory.items[this.slotIndex] = undefined;
				}
			}
		} else if (a instanceof Item) {
			const b = this.inventory.items[this.slotIndex];
			if (b) {
				if (a.mayStackWith(b) && b.mayStackWith(a) && b.amount < b.stackSize) {
					a.amount--;
					b.amount++;
				}
			} else if (b === undefined) {
				if (this.inventory.mayPut(this.slotIndex, a)) {
					const newStack = a.clone();
					newStack.amount = 1;
					a.amount--;
					this.inventory.items[this.slotIndex] = newStack;
				}
			}
			if (a.amount < 1) {
				a.destroy();
				this.game.ui.heldItem = undefined;
			}
		}

		this.game.ui.updateInventory(this.slotIndex);
		this.update();
	}

	click(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (this.game.ui.heldItem === undefined) {
			const tmp = this.inventory.items[this.slotIndex];
			this.inventory.items[this.slotIndex] = this.game.ui.heldItem;
			this.game.ui.heldItem = tmp;
		} else {
			const a = this.game.ui.heldItem;
			const b = this.inventory.items[this.slotIndex];
			if (
				a instanceof Item &&
				b instanceof Item &&
				a.mayStackWith(b) &&
				b.mayStackWith(a)
			) {
				const transfer = Math.min(a.amount, b.stackSize - b.amount);
				a.amount -= transfer;
				b.amount += transfer;
				if (a.amount === 0) {
					a.destroy();
					this.game.ui.heldItem = undefined;
				}
			} else if (a instanceof Item) {
				if (this.inventory.mayPut(this.slotIndex, a)) {
					this.inventory.items[this.slotIndex] = a;
					this.game.ui.heldItem = b;
				}
			}
		}

		this.game.ui.updateInventory(this.slotIndex);
		this.update();
	}

	update() {
		const item = this.inventory.items[this.slotIndex];
		const active =
			this.showActive && this.inventory.selection === this.slotIndex;
		if (active) {
			this.div.classList.add(styles.active);
		} else {
			this.div.classList.remove(styles.active);
		}
		this.widget.update(item, active);
	}
}
