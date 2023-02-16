import { Inventory } from '../../../world/item/inventory';
import styles from './inventoryWrap.module.css';
import { InventoryRow } from './inventoryRow';
import { Game } from '../../../game';

export class InventoryWrap {
    div: HTMLElement;
    active = false;
    game: Game;
    rows: InventoryRow[] = [];

    constructor(parent: HTMLElement, inventory: Inventory, game: Game) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.inventoryWrap);
        for (let i = 0; i < Math.ceil(inventory.items.length / 10); i++) {
            const row = new InventoryRow(this.div, inventory, i * 10, game);
            this.rows.push(row);
        }
        this.game = game;
        inventory.onChange = this.update.bind(this);
        parent.appendChild(this.div);
    }

    update(i: number) {
        if (i >= 0) {
            this.rows[i / 10].update(i);
        } else {
            for (let ni = 0; ni < this.rows.length; ni++) {
                this.rows[ni].update(i);
            }
        }
    }

    activate() {
        if (this.active) {
            return;
        }
        this.div.classList.add(styles.active);
        this.active = true;
    }

    deactivate() {
        if (!this.active) {
            return;
        }
        this.div.classList.remove(styles.active);
        this.active = false;
    }

    toggle() {
        if (this.active) {
            this.deactivate();
        } else {
            this.activate();
        }
    }
}
