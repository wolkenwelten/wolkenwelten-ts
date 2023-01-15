export const blocks:BlockType[] = [];
export const addBlockType = (name:string):BlockType => {
    const id = blocks.length;
    const ret = new BlockType(id, name);
    blocks[id] = ret;
    return ret;
};

export type MiningCat = "Pickaxe" | "Shovel" | "Axe";

export class BlockType {
    id:number;
    name:string;

    texTop = 0;
    texBottom = 0;
    texFront = 0;
    texBack = 0;
    texLeft = 0;
    texRight = 0;

    colorA = 0xFF8822FF;
    colorB = 0xFF11AAFF;

    minigCat: MiningCat = "Pickaxe";
    health = 100;

    constructor (id:number, name:string) {
        this.id = id;
        this.name = name;
    }

    withTexture (tex:number) {
        this.texTop = tex;
        this.texBottom = tex;
        this.texLeft = tex;
        this.texRight = tex;
        this.texFront = tex;
        this.texBack = tex;
        return this;
    }

    withTextureTop(tex:number) {
        this.texTop = tex;
        return this;
    }

    withTextureBottom(tex:number) {
        this.texBottom = tex;
        return this;
    }

    withTextureFront(tex:number) {
        this.texFront = tex;
        return this;
    }

    withTextureBack(tex:number) {
        this.texBack = tex;
        return this;
    }

    withTextureLeft(tex:number) {
        this.texLeft = tex;
        return this;
    }

    withTextureRight(tex:number) {
        this.texRight = tex;
        return this;
    }

    withColours(a:number, b:number) {
        this.colorA = a;
        this.colorB = b;
        return this;
    }

    withMiningCat(cat:MiningCat) {
        this.minigCat = cat;
        return this;
    }

    withBlockHealth(health:number) {
        this.health = health;
        return this;
    }
}