/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { ClientGame } from "../clientGame";
import { ChatPanel } from "./components/chatPanel";
import { FpsCounter } from "./components/fpsCounter";
import { IntroWindow } from "./components/introWindow";
import { PlayerModal } from "./components/playerModal/playerModal";
import { SystemLog } from "./components/systemLog";
import { IconManager } from "./icon";
import { RepulsionMultiplier } from "./components/repulsionMultiplier";
import { TouchControls } from "./components/touchControls";

export class UIManager {
	game: ClientGame;
	rootElement: HTMLElement;
	uiWrapper: HTMLElement;
	inventory: PlayerModal;
	icon: IconManager;
	log: SystemLog;
	introWindow: IntroWindow;
	chat: ChatPanel;
	repulsionMultiplier: RepulsionMultiplier;
	touchControls: TouchControls;

	rootHasPaused = false;

	constructor(game: ClientGame) {
		this.game = game;
		this.rootElement = game.config.parent;
		this.rootElement.setAttribute("paused", "false");

		this.icon = new IconManager(this);

		this.uiWrapper = document.createElement("div");
		this.uiWrapper.id = "wolkenwelten-ui-root";
		this.rootElement.append(this.uiWrapper);
		new FpsCounter(this.uiWrapper, game);
		this.log = new SystemLog(this.uiWrapper, game);
		this.inventory = new PlayerModal(this.uiWrapper, game);
		this.introWindow = new IntroWindow(this.uiWrapper, game);
		this.chat = new ChatPanel(this.uiWrapper, game);
		this.repulsionMultiplier = new RepulsionMultiplier(this.uiWrapper, game);
		this.touchControls = new TouchControls(this.uiWrapper, game);
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
		this.repulsionMultiplier.update();
		this.touchControls.update();
	}
}
