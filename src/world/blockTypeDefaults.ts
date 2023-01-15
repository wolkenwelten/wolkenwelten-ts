import { addBlockType, blocks } from "./blockType";

export const initDefaultBlocks = () => {
    blocks.length = 0;
    addBlockType("Air");

    addBlockType("Dirt")
        .withTexture(1)
        .withColours(0x110A00FF, 0x201200FF)
        .withMiningCat("Shovel")
        .withBlockHealth(2000);

    addBlockType("Grass")
        .withTexture(16)
        .withTextureTop(0)
        .withTextureBottom(1)
        .withColours(0x081200FF, 0x110A00FF)
        .withMiningCat("Shovel")
        .withBlockHealth(2500);

    addBlockType("Stone")
        .withTexture(2)
        .withColours(0x5E5E5EFF, 0x484848FF)
        .withMiningCat("Pickaxe")
        .withBlockHealth(8000);

    addBlockType("Coal")
        .withTexture(3)
        .withColours(0x262626FF, 0x101010FF)
        .withMiningCat("Pickaxe")
        .withBlockHealth(7000);

    addBlockType("Spruce log")
        .withTexture(4)
        .withColours(0x251B05FF, 0x1D1607FF)
        .withMiningCat("Axe")
        .withBlockHealth(6000);

    addBlockType("Spruce leaves")
        .withTexture(5)
        .withColours(0x122C01FF, 0x0F2501FF)
        .withBlockHealth(1000);

    addBlockType("Dry grass")
        .withTexture(22)
        .withTextureTop(6)
        .withTextureBottom(1)
        .withColours(0x4B6411FF, 0x4F230AFF)
        .withMiningCat("Shovel")
        .withBlockHealth(2000);

    addBlockType("Roots")
        .withTexture(7)
        .withColours(0x3E3214FF, 0x29200DFF)
        .withMiningCat("Shovel")
        .withBlockHealth(5000);

    addBlockType("Obsidian")
        .withTexture(8)
        .withColours(0x222222FF, 0x171717FF)
        .withMiningCat("Pickaxe")
        .withBlockHealth(14000);

    addBlockType("Oak log")
        .withTexture(9)
        .withColours(0x3C2C08FF, 0x2E2408FF)
        .withMiningCat("Axe")
        .withBlockHealth(7000);

    addBlockType("Oak leaves")
        .withTexture(10)
        .withColours(0x274200FF, 0x183300FF)
        .withBlockHealth(1000);

    addBlockType("Iron ore (hematite)")
        .withTexture(11)
        .withColours(0x725B5BFF, 0x5E5E5EFF)
        .withMiningCat("Pickaxe")
        .withBlockHealth(10000);

    addBlockType("Marble block")
        .withTexture(12)
        .withColours(0xF0F0F0FF, 0xF0F0F0FF)
        .withMiningCat("Pickaxe")
        .withBlockHealth(10000);

    addBlockType("Marble pillar")
        .withTexture(13)
        .withTextureTop(12)
        .withTextureBottom(12)
        .withColours(0xF0F0F0FF, 0xF0F0F0FF)
        .withMiningCat("Pickaxe")
        .withBlockHealth(10000);

    addBlockType("Marble blocks")
        .withTexture(14)
        .withColours(0xF0F0F0FF, 0xF0F0F0FF)
        .withMiningCat("Pickaxe")
        .withBlockHealth(10000);

    addBlockType("Acacia leaves")
        .withTexture(15)
        .withColours(0x023000FF, 0x326F1CFF)
        .withBlockHealth(1000);

    addBlockType("Boards")
        .withTexture(17)
        .withColours(0x8F6709FF, 0xAF8013FF)
        .withMiningCat("Axe")
        .withBlockHealth(4000);

    addBlockType("Crystals")
        .withTexture(18)
        .withColours(0xE87C99FF, 0xB5244DFF)
        .withMiningCat("Pickaxe")
        .withBlockHealth(20000);

    addBlockType("Sakura leaves")
        .withTexture(19)
        .withColours(0xE87C99FF, 0xB5254DFF)
        .withBlockHealth(1000);

    addBlockType("Birch log")
        .withTexture(20)
        .withColours(0x555252FF, 0xA5A2A2FF)
        .withMiningCat("Axe")
        .withBlockHealth(6000);

    addBlockType("Flower bush")
        .withTexture(21)
        .withColours(0x274200FF, 0x183300FF)
        .withBlockHealth(1000);

    addBlockType("Date bush")
        .withTexture(23)
        .withColours(0x4F3300FF, 0x948312FF)
        .withBlockHealth(1000);

    addBlockType("Sand")
        .withTexture(24)
        .withColours(0xECD195FF, 0xD3A748FF)
        .withBlockHealth(1400);
};