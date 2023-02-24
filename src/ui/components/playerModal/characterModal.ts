/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Inventory } from '../../../world/item/inventory';
import styles from './characterModal.module.css';
import { InventoryRow } from '../item/inventoryRow';
import { Game } from '../../../game';

export class CharacterWrap {
    div: HTMLElement;
    game: Game;
    table: HTMLElement;

    constructor(parent: HTMLElement, game: Game) {
        this.game = game;
        this.div = document.createElement('div');
        this.div.classList.add(styles.characterWrap);

        this.table = document.createElement('table');
        this.table.classList.add(styles.statTable);

        this.table.innerHTML = `<h4>Character</h4>
<table>
<tbody>
<tr><th>Level</th><td stat-key="level"></td></tr>
<tr><th>Experience</th><td stat-key="xp"></td></tr>
<tr><th>Next Level at</th><td stat-key="xpNextLevel"></td></tr>
<tr><th>Health</th><td stat-key="health"></td></tr>
</tbody></table>`;

        this.div.append(this.table);
        parent.appendChild(this.div);
        this.update();
    }

    update() {
        const player = this.game.player;
        const data = {
            level: String(player.level + 1),
            xp: String(player.xp),
            xpNextLevel: String(player.xpForLevel(this.game.player.level + 1)),
            health: `${player.health}/${player.maxHealth}`,
        };
        for (const td of this.table.querySelectorAll('td')) {
            const key = td.getAttribute('stat-key');
            const d = data[key];
            if (d) {
                td.innerText = d;
            }
        }
    }
}
