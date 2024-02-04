/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from '../../../game';
import { Item } from '../../../world/item/item';
import { Div } from '../../utils';
import { InventorySlotWidget } from '../item/inventorySlotWidget';
import styles from './hotbar.module.css';

export type HotbarEntryValue = Item | undefined;

export class HotbarEntry {
	i: number;
	slot: HTMLElement;
	widget: InventorySlotWidget;
	game: Game;
	value: HotbarEntryValue;

	constructor(parent: HTMLElement, game: Game, i: number) {
		this.i = i;
		this.game = game;
		parent.appendChild(
			(this.slot = Div({
				class: styles.hotbarSlot,
				attributes: {
					'slot-index': String((i + 1) % 10),
				},
				onMousedown: e => e.stopPropagation(),
				onClick: this.click.bind(this),
				onContextmenu: this.rightClick.bind(this),
			}))
		);
		this.widget = new InventorySlotWidget(
			this.slot,
			game.player.inventory,
			i,
			game,
			false
		);
	}

	click(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		this.use();
	}

	rightClick(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		this.value = undefined;
		this.widget.update();
	}

	update() {
		if (this.value?.destroyed) {
			this.value = undefined;
		}
		this.widget.update();
	}

	use() {
		this.value?.use(this.game.player);
	}
}

export class Hotbar {
	div: HTMLElement;
	entries: HotbarEntry[] = [];

	constructor(parent: HTMLElement, game: Game) {
		this.div = Div({ class: styles.hotbar });
		for (let i = 0; i < 10; i++) {
			this.entries[i] = new HotbarEntry(this.div, game, i);
		}
		parent.appendChild(this.div);
	}

	add(v: HotbarEntryValue) {
		for (let entry of this.entries) {
			entry.update();
			if (!entry.value) {
				entry.value = v;
				entry.update();
				return;
			}
		}
	}

	update() {
		for (const entry of this.entries) {
			entry.update();
		}
	}

	use(i: number) {
		this.entries[i]?.use();
	}

	clear() {
		for (const entry of this.entries) {
			entry.value = undefined;
			entry.update();
		}
	}
}
