import blockTextureUrl from '../../../assets/gfx/blocks.png';

import { BlockItem } from '../item/blockItem';
import { World } from '../world';

export const initDefaultBlocks = (world: World) => {
    world.blocks.length = 0;
    world.game.blockTextureUrl = blockTextureUrl;
    world.addBlockType('Air').withInvisible();

    world
        .addBlockType('Dirt')
        .withTexture(1)
        .withColours(0x311e00ff, 0x412800ff)
        .withMiningCat('Shovel')
        .withBlockHealth(200);

    world
        .addBlockType('Grass')
        .withTexture(16)
        .withTextureTop(0)
        .withTextureBottom(1)
        .withColours(0x003807ff, 0x412800ff)
        .withMiningCat('Shovel')
        .withSimpleHandler(new BlockItem(world, 1, 1))
        .withBlockHealth(250);

    world
        .addBlockType('Stone')
        .withTexture(2)
        .withColours(0x5e5e5eff, 0x484848ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(800);

    world
        .addBlockType('Coal')
        .withTexture(3)
        .withColours(0x262626ff, 0x101010ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(700);

    world
        .addBlockType('Spruce log')
        .withTexture(4)
        .withColours(0x251b05ff, 0x1d1607ff)
        .withMiningCat('Axe')
        .withBlockHealth(600);

    world
        .addBlockType('Spruce leaves')
        .withTexture(5)
        .withColours(0x122c01ff, 0x0f2501ff)
        .withItemDropHandler(() => {})
        .withBlockHealth(100);

    world
        .addBlockType('Dry grass')
        .withTexture(22)
        .withTextureTop(6)
        .withTextureBottom(1)
        .withColours(0x4b6411ff, 0x4f230aff)
        .withMiningCat('Shovel')
        .withSimpleHandler(new BlockItem(world, 1, 1))
        .withBlockHealth(200);

    world
        .addBlockType('Roots')
        .withTexture(7)
        .withColours(0x3e3214ff, 0x29200dff)
        .withMiningCat('Shovel')
        .withSimpleHandler(new BlockItem(world, 1, 1))
        .withBlockHealth(5000);

    world
        .addBlockType('Obsidian')
        .withTexture(8)
        .withColours(0x222222ff, 0x171717ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1400);

    world
        .addBlockType('Oak log')
        .withTexture(9)
        .withColours(0x3c2c08ff, 0x2e2408ff)
        .withMiningCat('Axe')
        .withBlockHealth(700);

    world
        .addBlockType('Oak leaves')
        .withTexture(10)
        .withColours(0x274200ff, 0x183300ff)
        .withItemDropHandler(() => {})
        .withBlockHealth(100);

    world
        .addBlockType('Iron ore (hematite)')
        .withTexture(11)
        .withColours(0x725b5bff, 0x5e5e5eff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(10000);

    world
        .addBlockType('Marble block')
        .withTexture(12)
        .withColours(0xf0f0f0ff, 0xf0f0f0ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1000);

    world
        .addBlockType('Marble pillar')
        .withTexture(13)
        .withTextureTop(12)
        .withTextureBottom(12)
        .withColours(0xf0f0f0ff, 0xf0f0f0ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1000);

    world
        .addBlockType('Marble blocks')
        .withTexture(14)
        .withColours(0xf0f0f0ff, 0xf0f0f0ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1000);

    world
        .addBlockType('Acacia leaves')
        .withTexture(15)
        .withColours(0x023000ff, 0x326f1cff)
        .withItemDropHandler(() => {})
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
        .addBlockType('Sakura leaves')
        .withTexture(19)
        .withColours(0xe87c99ff, 0xb5254dff)
        .withItemDropHandler(() => {})
        .withBlockHealth(100);

    world
        .addBlockType('Birch log')
        .withTexture(20)
        .withColours(0x555252ff, 0xa5a2a2ff)
        .withMiningCat('Axe')
        .withBlockHealth(600);

    world
        .addBlockType('Flower bush')
        .withTexture(21)
        .withColours(0x274200ff, 0x183300ff)
        .withItemDropHandler(() => {})
        .withBlockHealth(100);

    world
        .addBlockType('Date bush')
        .withTexture(23)
        .withColours(0x4f3300ff, 0x948312ff)
        .withItemDropHandler(() => {})
        .withBlockHealth(100);

    world
        .addBlockType('Sand')
        .withTexture(24)
        .withColours(0xecd195ff, 0xd3a748ff)
        .withBlockHealth(140);

    world
        .addBlockType('Sea Water')
        .withTexture(25)
        .withColours(0x0036d4ff, 0x0000bdff)
        .withLiquid()
        .withSeeThrough()
        .withItemDropHandler(() => {})
        .withBlockHealth(140);
};
