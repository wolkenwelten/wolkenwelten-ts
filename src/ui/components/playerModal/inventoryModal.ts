/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './inventoryModal.module.css';
import { InventoryRow } from '../item/inventoryRow';
import { Game } from '../../../game';

export class InventoryWrap {
    div: HTMLElement;
    active = false;
    game: Game;
    rows: InventoryRow[] = [];

    constructor(parent: HTMLElement, game: Game) {
        const inventory = game.player.inventory;

        this.div = document.createElement('div');
        this.div.classList.add(styles.inventoryWrap);
        for (let i = 0; i < Math.ceil(inventory.items.length / 10); i++) {
            const row = new InventoryRow(
                this.div,
                inventory,
                i * 10,
                game,
                false
            );
            this.rows.push(row);
        }
        this.game = game;
        parent.appendChild(this.div);
    }

    update(i = -1) {
        for (let ni = 0; ni < this.rows.length; ni++) {
            this.rows[ni].update(i);
        }
    }
}
