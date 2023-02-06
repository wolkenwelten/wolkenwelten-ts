import { addBlockType, blocks } from './blockType';
import blockTextureUrl from '../../../assets/gfx/blocks.png';
import { Game } from '../../game';

export const initDefaultBlocks = (game: Game) => {
    blocks.length = 0;
    game.blockTextureUrl = blockTextureUrl;
    addBlockType('Air').withInvisible();

    addBlockType('Dirt')
        .withTexture(1)
        .withColours(0x311e00ff, 0x412800ff)
        .withMiningCat('Shovel')
        .withBlockHealth(200);

    addBlockType('Grass')
        .withTexture(16)
        .withTextureTop(0)
        .withTextureBottom(1)
        .withColours(0x003807ff, 0x412800ff)
        .withMiningCat('Shovel')
        .withBlockHealth(250);

    addBlockType('Stone')
        .withTexture(2)
        .withColours(0x5e5e5eff, 0x484848ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(800);

    addBlockType('Coal')
        .withTexture(3)
        .withColours(0x262626ff, 0x101010ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(700);

    addBlockType('Spruce log')
        .withTexture(4)
        .withColours(0x251b05ff, 0x1d1607ff)
        .withMiningCat('Axe')
        .withBlockHealth(600);

    addBlockType('Spruce leaves')
        .withTexture(5)
        .withColours(0x122c01ff, 0x0f2501ff)
        .withBlockHealth(100);

    addBlockType('Dry grass')
        .withTexture(22)
        .withTextureTop(6)
        .withTextureBottom(1)
        .withColours(0x4b6411ff, 0x4f230aff)
        .withMiningCat('Shovel')
        .withBlockHealth(200);

    addBlockType('Roots')
        .withTexture(7)
        .withColours(0x3e3214ff, 0x29200dff)
        .withMiningCat('Shovel')
        .withBlockHealth(5000);

    addBlockType('Obsidian')
        .withTexture(8)
        .withColours(0x222222ff, 0x171717ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1400);

    addBlockType('Oak log')
        .withTexture(9)
        .withColours(0x3c2c08ff, 0x2e2408ff)
        .withMiningCat('Axe')
        .withBlockHealth(700);

    addBlockType('Oak leaves')
        .withTexture(10)
        .withColours(0x274200ff, 0x183300ff)
        .withBlockHealth(100);

    addBlockType('Iron ore (hematite)')
        .withTexture(11)
        .withColours(0x725b5bff, 0x5e5e5eff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(10000);

    addBlockType('Marble block')
        .withTexture(12)
        .withColours(0xf0f0f0ff, 0xf0f0f0ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1000);

    addBlockType('Marble pillar')
        .withTexture(13)
        .withTextureTop(12)
        .withTextureBottom(12)
        .withColours(0xf0f0f0ff, 0xf0f0f0ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1000);

    addBlockType('Marble blocks')
        .withTexture(14)
        .withColours(0xf0f0f0ff, 0xf0f0f0ff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(1000);

    addBlockType('Acacia leaves')
        .withTexture(15)
        .withColours(0x023000ff, 0x326f1cff)
        .withBlockHealth(100);

    addBlockType('Boards')
        .withTexture(17)
        .withColours(0x8f6709ff, 0xaf8013ff)
        .withMiningCat('Axe')
        .withBlockHealth(400);

    addBlockType('Crystals')
        .withTexture(18)
        .withColours(0xe87c99ff, 0xb5244dff)
        .withMiningCat('Pickaxe')
        .withBlockHealth(2000);

    addBlockType('Sakura leaves')
        .withTexture(19)
        .withColours(0xe87c99ff, 0xb5254dff)
        .withBlockHealth(100);

    addBlockType('Birch log')
        .withTexture(20)
        .withColours(0x555252ff, 0xa5a2a2ff)
        .withMiningCat('Axe')
        .withBlockHealth(600);

    addBlockType('Flower bush')
        .withTexture(21)
        .withColours(0x274200ff, 0x183300ff)
        .withBlockHealth(100);

    addBlockType('Date bush')
        .withTexture(23)
        .withColours(0x4f3300ff, 0x948312ff)
        .withBlockHealth(100);

    addBlockType('Sand')
        .withTexture(24)
        .withColours(0xecd195ff, 0xd3a748ff)
        .withBlockHealth(140);

    addBlockType('Sea Water')
        .withTexture(25)
        .withColours(0x0036d4ff, 0x0000bdff)
        .withLiquid()
        .withSeeThrough()
        .withBlockHealth(140);
};
