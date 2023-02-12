import { Game } from './game';
import { ItemDrop } from './world/entity/itemDrop';
import { BlockItem } from './world/item/blockItem';
import { Item } from './world/item/item';

export class AdditionManager {
    private _game: Game;

    constructor(game: Game) {
        this._game = game;
    }

    blockItem(blockType: number, amount: number): BlockItem {
        return new BlockItem(this._game.world, blockType, amount);
    }

    item(name: string): Item {
        return new Item(this._game.world, name);
    }

    itemDrop(x: number, y: number, z: number, item: Item): ItemDrop {
        return new ItemDrop(this._game.world, x, y, z, item);
    }

    blockItemDrop(
        x: number,
        y: number,
        z: number,
        blockType: number,
        amount: number
    ): ItemDrop {
        return this.itemDrop(x, y, z, this.blockItem(blockType, amount));
    }
}
