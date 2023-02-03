import { Game } from '../game';
import { Item, MaybeItem } from '../world/item/item';
import { FpsCounter } from './components/fpsCounter';
import { Crosshair } from './components/crosshair';
import { InventoryBar } from './components/item/inventoryBar';

export class UIManager {
    game: Game;
    uiRoot: HTMLElement;
    fps = 0;
    inventory: MaybeItem[] = [];

    constructor(game: Game) {
        this.game = game;
        this.uiRoot = document.createElement('div');
        this.uiRoot.id = 'wolkenwelten-ui-root';
        game.rootElement.append(this.uiRoot);
        new FpsCounter(this.uiRoot, game);
        new Crosshair(this.uiRoot);
        new InventoryBar(this.uiRoot, game.player.inventory);
    }

    updateFPS(fps: number) {
        this.fps = fps;
    }

    updateInventory() {
        this.inventory = this.game.player.inventory.items;
    }
}
