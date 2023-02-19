/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import blockTextureUrl from '../../../assets/gfx/blocks.png';
import { ItemDrop } from '../entity/itemDrop';

import { BlockItem } from '../item/blockItem';
import { MaybeItem } from '../item/item';
import { World } from '../world';

import { Stick } from '../item/material/stick';
import { Stone } from '../item/material/stone';
import { IronOre } from '../item/material/ironOre';
import { Coal } from '../item/material/coal';

const leafDropHandler = (
    world: World,
    x: number,
    y: number,
    z: number,
    tool: MaybeItem
) => {
    const t = world.game.ticks & 7;
    if (t < 3) {
        new ItemDrop(world, x + 0.5, y + 0.4, z + 0.5, new Stick(world));
    }
};

const stoneDropHandler = (
    world: World,
    x: number,
    y: number,
    z: number,
    tool: MaybeItem
) => {
    new ItemDrop(world, x + 0.5, y + 0.4, z + 0.5, new Stone(world, 5));
};

const ironOreDropHandler = (
    world: World,
    x: number,
    y: number,
    z: number,
    tool: MaybeItem
) => {
    new ItemDrop(world, x + 0.4, y + 0.4, z + 0.4, new Stone(world, 2));
    new ItemDrop(world, x + 0.6, y + 0.4, z + 0.6, new IronOre(world, 3));
};

const coalDropHandler = (
    world: World,
    x: number,
    y: number,
    z: number,
    tool: MaybeItem
) => {
    new ItemDrop(world, x + 0.4, y + 0.4, z + 0.4, new Stone(world, 2));
    new ItemDrop(world, x + 0.6, y + 0.4, z + 0.6, new Coal(world, 3));
};

export const initDefaultBlocks = (world: World) => {
    world.blocks.length = 0;
    world.blockTextureUrl = blockTextureUrl;
    world.addBlockType('Air').withInvisible();

    world
        .addBlockType('Dirt')
        .withTexture(1)
        .withColours(0x311e00ff, 0x412800ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(350);

    world
        .addBlockType('Grass')
        .withTexture(16)
        .withTextureTop(0)
        .withTextureBottom(1)
        .withColours(0x003807ff, 0x412800ff)
        .withMiningCat('Pickaxe')
        .withSimpleHandler(new BlockItem(world, 1, 1))
        .withBlockHealth(450);

    world
        .addBlockType('Stone')
        .withTexture(2)
        .withColours(0x5e5e5eff, 0x484848ff)
        .withMiningCat('Pickaxe')
        .withItemDropHandler(stoneDropHandler)
        .withBlockHealth(800);

    world
        .addBlockType('Coal')
        .withTexture(3)
        .withColours(0x262626ff, 0x101010ff)
        .withMiningCat('Pickaxe')
        .withItemDropHandler(coalDropHandler)
        .withBlockHealth(700);

    world
        .addBlockType('Spruce log', 'SpruceLog')
        .withTexture(4)
        .withColours(0x251b05ff, 0x1d1607ff)
        .withMiningCat('Axe')
        .withBlockHealth(600);

    world
        .addBlockType('Spruce leaves', 'SpruceLeaves')
        .withTexture(5)
        .withColours(0x122c01ff, 0x0f2501ff)
        .withMiningCat('Axe')
        .withItemDropHandler(leafDropHandler)
        .withBlockHealth(100);

    world
        .addBlockType('Dry grass', 'DryGrass')
        .withTexture(22)
        .withTextureTop(6)
        .withTextureBottom(1)
        .withColours(0x4b6411ff, 0x4f230aff)
        .withMiningCat('Pickaxe')
        .withSimpleHandler(new BlockItem(world, 1, 1))
        .withBlockHealth(200);

    world
        .addBlockType('Roots')
        .withTexture(7)
        .withColours(0x3e3214ff, 0x29200dff)
        .withMiningCat('Pickaxe')
        .withSimpleHandler(new BlockItem(world, 1, 1))
        .withBlockHealth(500);

    world
        .addBlockType('Obsidian')
        .withTexture(8)
        .withColours(0x222222ff, 0x171717ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1400);

    world
        .addBlockType('Oak log', 'OakLog')
        .withTexture(9)
        .withColours(0x3c2c08ff, 0x2e2408ff)
        .withMiningCat('Axe')
        .withBlockHealth(700);

    world
        .addBlockType('Oak leaves', 'OakLeaves')
        .withTexture(10)
        .withColours(0x274200ff, 0x183300ff)
        .withMiningCat('Axe')
        .withItemDropHandler(leafDropHandler)
        .withBlockHealth(100);

    world
        .addBlockType('Iron ore', 'IronOre')
        .withTexture(11)
        .withColours(0x725b5bff, 0x5e5e5eff)
        .withMiningCat('Pickaxe')
        .withItemDropHandler(ironOreDropHandler)
        .withBlockHealth(1000);

    world
        .addBlockType('Marble block', 'MarbleBlock')
        .withTexture(12)
        .withColours(0xf0f0f0ff, 0xf0f0f0ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1000);

    world
        .addBlockType('Marble pillar', 'MarblePillar')
        .withTexture(13)
        .withTextureTop(12)
        .withTextureBottom(12)
        .withColours(0xf0f0f0ff, 0xf0f0f0ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1000);

    world
        .addBlockType('Marble blocks', 'MarbleBlocks')
        .withTexture(14)
        .withColours(0xf0f0f0ff, 0xf0f0f0ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1000);

    world
        .addBlockType('Acacia leaves', 'AcaciaLeaves')
        .withTexture(15)
        .withColours(0x023000ff, 0x326f1cff)
        .withMiningCat('Axe')
        .withItemDropHandler(leafDropHandler)
        .withBlockHealth(100);

    world
        .addBlockType('Boards')
        .withTexture(17)
        .withColours(0x8f6709ff, 0xaf8013ff)
        .withMiningCat('Axe')
        .withBlockHealth(400);

    world
        .addBlockType('Crystals')
        .withTexture(18)
        .withColours(0xe87c99ff, 0xb5244dff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(2000);

    world
        .addBlockType('Sakura leaves', 'SakuraLeaves')
        .withTexture(19)
        .withColours(0xe87c99ff, 0xb5254dff)
        .withMiningCat('Axe')
        .withItemDropHandler(leafDropHandler)
        .withBlockHealth(100);

    world
        .addBlockType('Birch log', 'BirchLog')
        .withTexture(20)
        .withColours(0x555252ff, 0xa5a2a2ff)
        .withMiningCat('Axe')
        .withBlockHealth(600);

    world
        .addBlockType('Flower bush', 'FlowerBush')
        .withTexture(21)
        .withColours(0x274200ff, 0x183300ff)
        .withMiningCat('Axe')
        .withItemDropHandler(leafDropHandler)
        .withBlockHealth(100);

    world
        .addBlockType('Date bush', 'DateBush')
        .withTexture(23)
        .withColours(0x4f3300ff, 0x948312ff)
        .withMiningCat('Axe')
        .withItemDropHandler(leafDropHandler)
        .withBlockHealth(100);

    world
        .addBlockType('Sand')
        .withTexture(24)
        .withColours(0xecd195ff, 0xd3a748ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(240);

    world
        .addBlockType('Sea Water', 'SeaWater')
        .withTexture(25)
        .withColours(0x0036d4ff, 0x0000bdff)
        .withLiquid()
        .withSeeThrough()
        .withItemDropHandler(() => {})
        .withBlockHealth(340);
};
