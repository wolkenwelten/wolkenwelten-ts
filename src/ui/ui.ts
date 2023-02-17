/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../game';
import { HealthBar } from './components/health/healthBar';
import { FpsCounter } from './components/fpsCounter';
import { Crosshair } from './components/crosshair';
import { InventoryWrap } from './components/item/inventoryWrap';
import { CursorItem } from './components/item/cursorItem';
import { XpView } from './components/xpView';
import { IconManager } from './icon';
import { MaybeItem } from '../world/item/item';

export class UIManager {
    game: Game;
    rootElement: HTMLElement;
    uiWrapper: HTMLElement;
    inventory: InventoryWrap;
    cursorItem: CursorItem;
    icon: IconManager;
    heldItem: MaybeItem;

    constructor(game: Game) {
        this.game = game;
        this.rootElement = game.config.parent;

        this.uiWrapper = document.createElement('div');
        this.uiWrapper.id = 'wolkenwelten-ui-root';
        this.rootElement.append(this.uiWrapper);
        this.icon = new IconManager(this);
        new FpsCounter(this.uiWrapper, game);
        new HealthBar(this.uiWrapper, game);
        new Crosshair(this.uiWrapper);
        new XpView(this.uiWrapper, game);
        this.inventory = new InventoryWrap(
            this.uiWrapper,
            game.player.inventory,
            game
        );
        this.cursorItem = new CursorItem(this.uiWrapper);
    }
}
