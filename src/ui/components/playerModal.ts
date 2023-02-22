/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './playerModal.module.css';
import { Game } from '../../game';
import { CraftingWrap } from './crafting/craftingWrap';
import { InventoryWrap } from './item/inventoryWrap';
import { SettingsWrap } from './settings/settingsWrap';

export class PlayerModal {
    active = false;
    div: HTMLElement;
    game: Game;
    tabContent: HTMLElement;
    tabBar: HTMLElement;

    crafting: CraftingWrap;
    inventory: InventoryWrap;
    settings: SettingsWrap;

    initInventoryTab(game: Game) {
        const tab = document.createElement('div');
        tab.classList.add(styles.tabContent);
        tab.classList.add(styles.activeTab);

        const inventory = new InventoryWrap(tab, game.player.inventory, game);
        this.tabContent.appendChild(tab);

        const button = document.createElement('div');
        button.innerText = 'Inventory';
        button.classList.add(styles.tabButton);
        button.classList.add(styles.activeTabButton);
        this.tabBar.appendChild(button);

        const that = this;
        button.onclick = () => {
            for (const c of that.tabContent.children) {
                c.classList.remove(styles.activeTab);
            }
            for (const c of that.tabBar.children) {
                c.classList.remove(styles.activeTabButton);
            }
            tab.classList.add(styles.activeTab);
            button.classList.add(styles.activeTabButton);
            that.inventory.update(-1);
        };

        return inventory;
    }

    initCraftingTab(game: Game) {
        const tab = document.createElement('div');
        tab.classList.add(styles.tabContent);

        const crafting = new CraftingWrap(tab, game.player.inventory, game);
        this.tabContent.appendChild(tab);

        const button = document.createElement('div');
        button.innerText = 'Crafting';
        button.classList.add(styles.tabButton);
        this.tabBar.appendChild(button);

        const that = this;
        button.onclick = () => {
            for (const c of that.tabContent.children) {
                c.classList.remove(styles.activeTab);
            }
            for (const c of that.tabBar.children) {
                c.classList.remove(styles.activeTabButton);
            }
            tab.classList.add(styles.activeTab);
            button.classList.add(styles.activeTabButton);
            that.crafting.update();
        };

        return crafting;
    }

    initSettingsTab(game: Game) {
        const tab = document.createElement('div');
        tab.classList.add(styles.tabContent);

        const settings = new SettingsWrap(tab, game);
        this.tabContent.appendChild(tab);

        const button = document.createElement('div');
        button.innerText = 'Settings';
        button.classList.add(styles.tabButton);
        this.tabBar.appendChild(button);

        const that = this;
        button.onclick = () => {
            for (const c of that.tabContent.children) {
                c.classList.remove(styles.activeTab);
            }
            for (const c of that.tabBar.children) {
                c.classList.remove(styles.activeTabButton);
            }
            tab.classList.add(styles.activeTab);
            button.classList.add(styles.activeTabButton);
            that.settings.update();
        };

        return settings;
    }

    constructor(parent: HTMLElement, game: Game) {
        const div = document.createElement('div');
        this.div = div;
        this.div.classList.add(styles.modal);

        const tabBar = document.createElement('div');
        tabBar.classList.add(styles.tabBar);
        div.appendChild(tabBar);
        this.tabBar = tabBar;

        const tabContent = document.createElement('div');
        tabContent.classList.add(styles.tabContentWrap);
        div.appendChild(tabContent);
        this.tabContent = tabContent;

        this.inventory = this.initInventoryTab(game);
        this.crafting = this.initCraftingTab(game);
        this.settings = this.initSettingsTab(game);

        div.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        div.addEventListener('mousewheel', (e) => {
            e.stopPropagation();
        });

        this.game = game;

        parent.appendChild(div);
    }

    activate() {
        if (this.active) {
            return;
        }
        this.game.render.canvasWrapper.classList.add('fx-inventory');
        this.div.classList.add(styles.active);
        this.crafting.update();
        this.active = true;
    }

    deactivate() {
        if (!this.active) {
            return;
        }
        this.game.render.canvasWrapper.classList.remove('fx-inventory');
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

    update(i: number) {
        this.inventory.update(i);
    }
}
