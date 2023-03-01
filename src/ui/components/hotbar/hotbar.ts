/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './hotbar.module.css';
import { Game } from '../../../game';
import { ActiveSkill } from '../../../world/skill/skill';
import { Item } from '../../../world/item/item';
import { ItemWidget } from '../item/item';

export type HotbarEntryValue = Item | ActiveSkill | undefined;

export class HotbarEntry {
    i: number;
    slot: HTMLElement;
    widget: ItemWidget;
    game: Game;
    value: HotbarEntryValue;

    constructor(parent: HTMLElement, game: Game, i: number) {
        this.i = i;
        this.game = game;
        this.slot = document.createElement('div');
        this.slot.classList.add(styles.hotbarSlot);
        this.slot.setAttribute('slot-index', String((i + 1) % 10));
        this.widget = new ItemWidget(this.slot, false);

        this.slot.addEventListener('mousedown', (e) => e.stopPropagation());
        this.slot.addEventListener('click', this.click.bind(this));
        this.slot.addEventListener('contextmenu', this.rightClick.bind(this));

        parent.append(this.slot);
    }

    click(e: Event) {
        e.preventDefault();
        e.stopPropagation();

        if (this.game.ui.heldItem === undefined) {
            // Use Item/Skill
        } else {
            this.value = this.game.ui.heldItem;
            this.widget.update(this.value);
        }
    }

    rightClick(e: Event) {
        e.preventDefault();
        e.stopPropagation();

        this.value = undefined;
        this.widget.update(this.value);
    }

    update() {
        if (this.value instanceof ActiveSkill) {
        } else {
            this.widget.update(this.value);
        }
    }

    use() {
        if (this.value instanceof ActiveSkill) {
            this.game.player.skillUse(this.value.id);
        } else if (this.value instanceof Item) {
            this.value.use(this.game.player);
        }
    }
}

export class Hotbar {
    div: HTMLElement;
    entries: HotbarEntry[] = [];

    constructor(parent: HTMLElement, game: Game) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.hotbar);

        for (let i = 0; i < 10; i++) {
            this.entries[i] = new HotbarEntry(this.div, game, i);
        }

        parent.appendChild(this.div);
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
