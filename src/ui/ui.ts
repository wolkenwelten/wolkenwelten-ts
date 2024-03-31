/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from "../game";
import { Crosshair } from "./components/crosshair";
import { ChatPanel } from "./components/chatPanel";
import { HealthBar } from "./components/health/healthBar";
import { FpsCounter } from "./components/fpsCounter";
import { Hotbar, HotbarEntryValue } from "./components/hotbar/hotbar";
import { IntroWindow } from "./components/introWindow";
import { PlayerModal } from "./components/playerModal/playerModal";
import { SystemLog } from "./components/systemLog";
import { IconManager } from "./icon";
import { isClient, mockElement } from "../util/compat";

export class UIManager {
	game: Game;
	rootElement: HTMLElement;
	uiWrapper: HTMLElement;
	inventory: PlayerModal;
	healthBar: HealthBar;
	hotbar: Hotbar;
	icon: IconManager;
	heldItem: HotbarEntryValue;
	log: SystemLog;
	introWindow: IntroWindow;
	chat: ChatPanel;

	rootHasPaused = false;

	constructor(game: Game) {
		this.game = game;
		this.rootElement = game.config.parent || mockElement();
		this.rootElement.setAttribute("paused", "false");

		this.icon = new IconManager(this);

		this.uiWrapper = isClient() ? document.createElement("div") : mockElement();
		this.uiWrapper.id = "wolkenwelten-ui-root";
		this.rootElement.append(this.uiWrapper);
		new FpsCounter(this.uiWrapper, game);
		this.healthBar = new HealthBar(this.uiWrapper, game);
		this.log = new SystemLog(this.uiWrapper, game);
		this.inventory = new PlayerModal(this.uiWrapper, game);
		this.hotbar = new Hotbar(this.uiWrapper, game);
		this.introWindow = new IntroWindow(this.uiWrapper, game);
		this.chat = new ChatPanel(this.uiWrapper, game);
	}

	updateInventory(i = -1) {
		this.inventory.update(i);
	}

	update() {
		if (this.game.running) {
			if (this.rootHasPaused) {
				this.rootElement.setAttribute("paused", "false");
				this.rootHasPaused = false;
			}
		} else {
			if (!this.rootHasPaused) {
				this.rootElement.setAttribute("paused", "true");
				this.rootHasPaused = true;
			}
		}
		this.hotbar.update();
		this.healthBar.update(this.game.player.health, this.game.player.maxHealth);
	}
}
