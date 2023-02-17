/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { BlockItem } from '../item/blockItem';
import { ItemDrop } from '../entity/itemDrop';
import { World } from '../world';
import { Item, MaybeItem } from '../item/item';
import { abgrToRgba } from '../../util/math';

export type MiningCat = 'Pickaxe' | 'Axe';
export type BlockTypeItemDropHandler = (
    world: World,
    x: number,
    y: number,
    z: number,
    tool: MaybeItem
) => void;

export class BlockType {
    id: number;
    name: string;
    longName: string;

    texTop = 0;
    texBottom = 0;
    texFront = 0;
    texBack = 0;
    texLeft = 0;
    texRight = 0;

    colorA = 0xff8822ff;
    colorB = 0xff11aaff;

    miningCat: MiningCat = 'Pickaxe';
    health = 100;
    liquid = false;
    seeThrough = false;
    invisible = false;

    icon = '';
    placeSound = 'pock';
    mineSound = 'tock';

    constructor(id: number, longName: string, name?: string) {
        this.id = id;
        this.name = name || longName;
        this.longName = longName;
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
        this.colorA = abgrToRgba(a);
        this.colorB = abgrToRgba(b);
        return this;
    }

    withMiningCat(cat: MiningCat) {
        this.miningCat = cat;
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

    playPlaceSound(world: World) {
        world.game.audio.play(this.placeSound);
    }

    playMineSound(world: World) {
        world.game.audio.play(this.mineSound, 0.5);
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
            new BlockItem(world, this.id, 1)
        );
    }

    static simpleHandler(item: Item): BlockTypeItemDropHandler {
        return (
            world: World,
            x: number,
            y: number,
            z: number,
            tool: MaybeItem
        ) => {
            new ItemDrop(world, x + 0.5, y + 0.4, z + 0.5, item.clone());
        };
    }

    withItemDropHandler(λ: BlockTypeItemDropHandler) {
        this.spawnMiningDrops = λ;
        return this;
    }

    withSimpleHandler(item: Item) {
        return this.withItemDropHandler(BlockType.simpleHandler(item));
    }

    withMineSound(url: string) {
        this.mineSound = url;
        return this;
    }

    withPlaceSound(url: string) {
        this.placeSound = url;
        return this;
    }
}
