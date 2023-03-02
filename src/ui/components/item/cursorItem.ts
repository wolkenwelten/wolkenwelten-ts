/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { ItemWidget } from './item';
import styles from './cursorItem.module.css';
import { HotbarEntryValue } from '../hotbar/hotbar';
import { Div } from '../../utils';

export class CursorItem {
    div: HTMLElement;
    widget: ItemWidget;
    active = false;

    constructor(parent: HTMLElement) {
        const that = this;
        parent.appendChild((this.div = Div({ class: styles.slot })));
        parent.parentElement?.addEventListener('mousemove', (e) => {
            that.updatePos(e.pageX, e.pageY);
        });
        this.widget = new ItemWidget(this.div);
        this.update(undefined);
    }

    update(item: HotbarEntryValue) {
        if (item) {
            this.active = true;
            this.div.style.display = 'block';
            this.widget.update(item, false);
        } else {
            this.active = false;
            this.div.style.display = 'none';
        }
    }

    updatePos(x: number, y: number) {
        if (!this.active) {
            return;
        }
        this.div.style.transform = `translate(${x | 0}px, ${y | 0}px)`;
    }
}
