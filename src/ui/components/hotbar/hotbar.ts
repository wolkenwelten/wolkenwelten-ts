/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './hotbar.module.css';
import { Game } from '../../../game';
import { ActiveSkill } from '../../../world/skill/skill';
import { Item } from '../../../world/item/item';
import { ItemWidget } from '../item/item';
import { Div } from '../../utils';

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
        parent.appendChild(
            (this.slot = Div({
                class: styles.hotbarSlot,
                attributes: {
                    'slot-index': String((i + 1) % 10),
                },
                onMousedown: (e) => e.stopPropagation(),
                onClick: this.click.bind(this),
                onContextmenu: this.rightClick.bind(this),
            }))
        );
        this.widget = new ItemWidget(this.slot, false);
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
            if (this.value?.destroyed) {
                this.value = undefined;
            }
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
        this.div = Div({ class: styles.hotbar });
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
