/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './playerModal.module.css';
import { Game } from '../../../game';
import { CraftingWrap } from './craftingWrap';
import { InventoryWrap } from './inventoryModal';
import { SettingsWrap } from './settingsWrap';
import { SkillWrap } from './skillWrap';

interface TabClass {
    update: () => void;
}
type TabConstructor<T extends TabClass> = new (
    tab: HTMLElement,
    game: Game
) => T;

export class PlayerModal {
    active = false;
    div: HTMLElement;
    game: Game;
    tabContent: HTMLElement;
    tabBar: HTMLElement;

    activeTab?: TabClass;
    crafting: CraftingWrap;
    inventory: InventoryWrap;
    settings: SettingsWrap;
    skill: SkillWrap;

    private initTab<T extends TabClass>(
        game: Game,
        title: string,
        constructor: TabConstructor<T>,
        activeTab = false
    ): T {
        const tab = document.createElement('div');
        tab.classList.add(styles.tabContent);
        if (activeTab) {
            tab.classList.add(styles.activeTab);
        }

        const o = new constructor(tab, game);
        this.tabContent.appendChild(tab);

        const button = document.createElement('div');
        button.innerText = title;
        button.classList.add(styles.tabButton);
        if (activeTab) {
            button.classList.add(styles.activeTabButton);
        }
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
            o.update();
            that.activeTab = o;
        };

        return o;
    }

    constructor(parent: HTMLElement, game: Game) {
        this.game = game;
        const div = document.createElement('div');
        this.div = div;
        this.div.classList.add(styles.modal);
        const λ = (e: Event) => {
            e.stopPropagation();
        };
        div.addEventListener('mousedown', λ);
        div.addEventListener('mousewheel', λ);

        const tabBar = document.createElement('div');
        tabBar.classList.add(styles.tabBar);
        div.appendChild(tabBar);
        this.tabBar = tabBar;

        const tabContent = document.createElement('div');
        tabContent.classList.add(styles.tabContentWrap);
        div.appendChild(tabContent);
        this.tabContent = tabContent;

        this.inventory = this.initTab(game, 'Inventory', InventoryWrap, true);
        this.crafting = this.initTab(game, 'Crafting', CraftingWrap);
        this.skill = this.initTab(game, 'Skills', SkillWrap);
        this.settings = this.initTab(game, 'Settings', SettingsWrap);

        parent.appendChild(div);
    }

    activate() {
        if (this.active) {
            return;
        }
        this.game.render.canvasWrapper.classList.add('fx-inventory');
        this.div.classList.add(styles.active);
        this.activeTab?.update();
        this.inventory.update(-1);
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
