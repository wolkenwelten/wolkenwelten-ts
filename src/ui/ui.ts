import { Game } from '../game';
import { HealthBar } from './components/health/healthBar';
import { FpsCounter } from './components/fpsCounter';
import { Crosshair } from './components/crosshair';
import { InventoryBar } from './components/item/inventoryBar';
import { IconManager } from './icon';

export class UIManager {
    game: Game;
    rootElement: HTMLElement;
    uiWrapper: HTMLElement;
    icon: IconManager;

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
        new InventoryBar(this.uiWrapper, game.player.inventory);
    }
}
