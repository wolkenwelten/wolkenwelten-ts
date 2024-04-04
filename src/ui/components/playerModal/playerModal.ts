/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from '../../../game';
import { Div } from '../../utils';
import styles from './playerModal.module.css';
import { SettingsWrap } from './settingsWrap';

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
	settings: SettingsWrap;

	private initTab<T extends TabClass>(
		game: Game,
		title: string,
		constructor: TabConstructor<T>,
		activeTab = false
	): T {
		const that = this;
		const tab = Div({
			classes: [styles.tabContent, activeTab && styles.activeTab],
		});

		const o = new constructor(tab, game);
		this.tabContent.appendChild(tab);

		const button = Div({
			classes: [styles.tabButton, activeTab && styles.activeTabButton],
			text: title,
			onClick: () => {
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
			},
		});
		this.tabBar.appendChild(button);
		return o;
	}

	constructor(parent: HTMLElement, game: Game) {
		this.game = game;
		this.div = Div({
			class: styles.modal,
			children: [
				(this.tabBar = Div({ class: styles.tabBar })),
				(this.tabContent = Div({ class: styles.tabContentWrap })),
			],
		});
		const λ = (e: Event) => {
			e.stopPropagation();
		};
		this.div.addEventListener('mousedown', λ);
		this.div.addEventListener('mousewheel', λ);

		this.settings = this.initTab(game, 'Settings', SettingsWrap, true);

		parent.appendChild(this.div);
	}

	activate() {
		if (this.active) {
			return;
		}
		this.game.render.canvasWrapper.classList.add('fx-inventory');
		this.div.classList.add(styles.active);
		this.activeTab?.update();
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

	update(i: number) {}
}
