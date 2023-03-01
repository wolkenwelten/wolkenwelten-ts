/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../game';
import { FpsCounter } from './components/fpsCounter';
import { Crosshair } from './components/crosshair';
import { Hotbar } from './components/hotbar';
import { HealthOrb } from './components/healthOrb';
import { SystemLog } from './components/systemLog';
import { CursorItem } from './components/item/cursorItem';
import { XpView } from './components/xpView';
import { IconManager } from './icon';
import { MaybeItem } from '../world/item/item';
import { PlayerModal } from './components/playerModal/playerModal';
import { IntroWindow } from './components/introWindow';

export class UIManager {
    game: Game;
    rootElement: HTMLElement;
    uiWrapper: HTMLElement;
    inventory: PlayerModal;
    hotbar: Hotbar;
    cursorItem: CursorItem;
    icon: IconManager;
    heldItem: MaybeItem;
    log: SystemLog;
    healthOrb: HealthOrb;
    xpView: XpView;
    introWindow: IntroWindow;

    rootHasPaused = false;

    constructor(game: Game) {
        this.game = game;
        this.rootElement = game.config.parent;
        this.rootElement.setAttribute('paused', 'false');

        this.icon = new IconManager(this);

        this.uiWrapper = document.createElement('div');
        this.uiWrapper.id = 'wolkenwelten-ui-root';
        this.rootElement.append(this.uiWrapper);

        new FpsCounter(this.uiWrapper, game);
        new Crosshair(this.uiWrapper);
        this.xpView = new XpView(this.uiWrapper, game);
        this.log = new SystemLog(this.uiWrapper, game);
        this.inventory = new PlayerModal(this.uiWrapper, game);
        this.hotbar = new Hotbar(this.uiWrapper, game);
        this.cursorItem = new CursorItem(this.uiWrapper);
        this.healthOrb = new HealthOrb(this.uiWrapper, game);
        this.introWindow = new IntroWindow(this.uiWrapper, game);

        game.player.inventory.onChange = this.updateInventory.bind(this);
    }

    updateInventory(i: number) {
        this.hotbar.update(i);
        this.inventory.update(i);
    }

    update() {
        if (this.game.running) {
            if (this.rootHasPaused) {
                this.rootElement.setAttribute('paused', 'false');
                this.rootHasPaused = false;
            }
        } else {
            if (!this.rootHasPaused) {
                this.rootElement.setAttribute('paused', 'true');
                this.rootHasPaused = true;
            }
        }

        this.healthOrb.update();
        this.xpView.update();
    }
}
