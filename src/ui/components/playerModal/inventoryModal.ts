/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from '../../../game';
import { Div } from '../../utils';
import { InventoryRow } from '../item/inventoryRow';
import { InventorySlotWidget } from '../item/inventorySlotWidget';
import styles from './inventoryModal.module.css';

export class InventoryWrap {
    div: HTMLElement;
    active = false;
    game: Game;
    rows: InventoryRow[] = [];
    equipmentWrap: HTMLElement;
    characterWrap: HTMLElement;

    equipmentHead: InventorySlotWidget;
    equipmentTorso: InventorySlotWidget;
    equipmentLegs: InventorySlotWidget;
    equipmentFeet: InventorySlotWidget;

    equipmentWeapon: InventorySlotWidget;
    equipmentShield: InventorySlotWidget;

    constructor(parent: HTMLElement, game: Game) {
        const inventory = game.player.inventory;

        this.div = Div({
            class: styles.inventoryWrap,
            children: [
                (this.characterWrap = Div({
                    class: styles.characterWrap,
                    html: `<table>
                    <tbody>
                    <tr><th>Level</th><td stat-key="level"></td></tr>
                    <tr><th>Experience</th><td stat-key="xp"></td></tr>
                    <tr><th>Next Level at</th><td stat-key="xpNextLevel"></td></tr>
                    <tr><th>Skill points</th><td stat-key="skillPoints"></td></tr>
                    <tr><th>Health</th><td stat-key="health"></td></tr>
                    <tr><th>Mana</th><td stat-key="mana"></td></tr>
                    </tbody></table>`,
                })),
                (this.equipmentWrap = Div({ class: styles.equipmentWrap })),
            ],
        });

        this.equipmentWeapon = new InventorySlotWidget(
            this.equipmentWrap,
            game.player.equipment,
            0,
            game,
            false,
            styles.slotWeapon
        );
        this.equipmentShield = new InventorySlotWidget(
            this.equipmentWrap,
            game.player.equipment,
            1,
            game,
            false,
            styles.slotShield
        );
        this.equipmentHead = new InventorySlotWidget(
            this.equipmentWrap,
            game.player.equipment,
            2,
            game,
            false,
            styles.slotHead
        );
        this.equipmentTorso = new InventorySlotWidget(
            this.equipmentWrap,
            game.player.equipment,
            3,
            game,
            false,
            styles.slotTorso
        );
        this.equipmentLegs = new InventorySlotWidget(
            this.equipmentWrap,
            game.player.equipment,
            4,
            game,
            false,
            styles.slotLegs
        );
        this.equipmentFeet = new InventorySlotWidget(
            this.equipmentWrap,
            game.player.equipment,
            5,
            game,
            false,
            styles.slotFeet
        );

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

        game.player.inventory.onChange = this.updateInventory.bind(this);
        game.player.equipment.onChange = this.updateEquipment.bind(this);
    }

    updateInventory(i = -1) {
        for (let ni = 0; ni < this.rows.length; ni++) {
            this.rows[ni].update(i);
        }
    }

    updateEquipment() {
        this.equipmentFeet.update();
        this.equipmentHead.update();
        this.equipmentLegs.update();
        this.equipmentShield.update();
        this.equipmentTorso.update();
        this.equipmentWeapon.update();
    }

    updateCharacter() {
        const player = this.game.player;
        const data = {
            level: String(player.level + 1),
            xp: String(player.xp),
            xpNextLevel: String(player.xpForLevel(this.game.player.level + 1)),
            health: `${Math.round(player.health)}/${player.maxHealth}`,
            mana: `${Math.round(player.mana)}/${player.maxMana}`,
            skillPoints: String(player.skillPoints),
        } as any;
        for (const td of this.characterWrap.querySelectorAll('td')) {
            const key = td.getAttribute('stat-key');
            const d = data[key || ''];
            if (d) {
                td.innerText = d;
            }
        }
    }

    update(i = -1) {
        this.updateInventory(i);
        this.updateEquipment();
        this.updateCharacter();
    }
}
