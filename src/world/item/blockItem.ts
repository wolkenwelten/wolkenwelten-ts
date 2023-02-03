import { blocks } from '../blockType/blockType';
import { Item } from './item';

export class BlockItem extends Item {
    blockType: number;
    amount: number;

    constructor(blockType: number, amount: number) {
        const bt = blocks[blockType];
        if (!bt) {
            throw new Error(`Invalid blockType: ${blockType}`);
        }
        super(bt.name);

        this.blockType = blockType;
        this.amount = amount;
    }
}
