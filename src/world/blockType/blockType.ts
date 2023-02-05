import { BlockItem } from '../item/blockItem';
import { ItemDrop } from '../entity/itemDrop';
import { World } from '../world';
import { MaybeItem } from '../item/item';

export const blocks: BlockType[] = [];
export const addBlockType = (name: string): BlockType => {
    const id = blocks.length;
    const ret = new BlockType(id, name);
    blocks[id] = ret;
    return ret;
};

export type MiningCat = 'Pickaxe' | 'Shovel' | 'Axe';

export class BlockType {
    id: number;
    name: string;

    texTop = 0;
    texBottom = 0;
    texFront = 0;
    texBack = 0;
    texLeft = 0;
    texRight = 0;

    colorA = 0xff8822ff;
    colorB = 0xff11aaff;

    minigCat: MiningCat = 'Pickaxe';
    health = 100;
    liquid = false;
    seeThrough = false;
    invisible = false;

    icon = '';

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }

    withTexture(tex: number) {
        this.texTop = tex;
        this.texBottom = tex;
        this.texLeft = tex;
        this.texRight = tex;
        this.texFront = tex;
        this.texBack = tex;
        return this;
    }

    withTextureTop(tex: number) {
        this.texTop = tex;
        return this;
    }

    withTextureBottom(tex: number) {
        this.texBottom = tex;
        return this;
    }

    withTextureFront(tex: number) {
        this.texFront = tex;
        return this;
    }

    withTextureBack(tex: number) {
        this.texBack = tex;
        return this;
    }

    withTextureLeft(tex: number) {
        this.texLeft = tex;
        return this;
    }

    withTextureRight(tex: number) {
        this.texRight = tex;
        return this;
    }

    withColours(a: number, b: number) {
        this.colorA = a;
        this.colorB = b;
        return this;
    }

    withMiningCat(cat: MiningCat) {
        this.minigCat = cat;
        return this;
    }

    withBlockHealth(health: number) {
        this.health = health;
        return this;
    }

    withLiquid(liquid = true) {
        this.liquid = liquid;
        return this;
    }

    withSeeThrough(seeThrough = true) {
        this.seeThrough = seeThrough;
        return this;
    }

    withInvisible(invisible = true) {
        this.seeThrough = this.invisible = invisible;
        return this;
    }

    spawnMiningDrops(
        world: World,
        x: number,
        y: number,
        z: number,
        tool: MaybeItem
    ) {
        if (this.id === 0) {
            return;
        }
        new ItemDrop(
            world,
            x + 0.5,
            y + 0.4,
            z + 0.5,
            new BlockItem(this.id, 1)
        );
    }
}
