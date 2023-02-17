/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './hotbar.module.css';
import { Game } from '../../game';
import { InventoryRow } from './item/inventoryRow';

export class Hotbar {
    div: HTMLElement;
    row: InventoryRow;

    constructor(parent: HTMLElement, game: Game) {
        const div = document.createElement('div');
        this.div = div;
        this.div.classList.add(styles.hotbar);
        this.row = new InventoryRow(div, game.player.inventory, 0, game);
        parent.appendChild(div);
    }

    update(i: number) {
        this.row.update(i);
    }
}
