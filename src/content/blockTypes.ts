/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import blockTextureUrl from "../../assets/gfx/blocks.png";

import type { World } from "../world/world";
import { ItemDrop } from "../world/entity/itemDrop";
import { BlockItem } from "../world/item/blockItem";
import { Item, MaybeItem } from "../world/item/item";

const leafDropHandler = (
	world: World,
	x: number,
	y: number,
	z: number,
	tool: MaybeItem,
) => {
	const t = world.game.ticks & 7;
	if (t < 3) {
		new ItemDrop(world, x + 0.5, y + 0.4, z + 0.5, Item.create("stick", world));
	}
};

const stoneDropHandler = (
	world: World,
	x: number,
	y: number,
	z: number,
	tool: MaybeItem,
) => {
	new ItemDrop(
		world,
		x + 0.5,
		y + 0.4,
		z + 0.5,
		Item.create("stone", world, 5),
	);
};

const ironOreDropHandler = (
	world: World,
	x: number,
	y: number,
	z: number,
	tool: MaybeItem,
) => {
	new ItemDrop(
		world,
		x + 0.4,
		y + 0.4,
		z + 0.4,
		Item.create("stone", world, 2),
	);
	new ItemDrop(
		world,
		x + 0.6,
		y + 0.4,
		z + 0.6,
		Item.create("ironOre", world, 3),
	);
};

const coalDropHandler = (
	world: World,
	x: number,
	y: number,
	z: number,
	tool: MaybeItem,
) => {
	new ItemDrop(
		world,
		x + 0.4,
		y + 0.4,
		z + 0.4,
		Item.create("stone", world, 2),
	);
	new ItemDrop(world, x + 0.6, y + 0.4, z + 0.6, Item.create("coal", world, 3));
};

export const blocks = {
	air: 0,
	dirt: 1,
	grass: 2,
	stone: 3,
	coal: 4,
	ironOre: 5,
	marbleBlock: 6,
	marblePillar: 7,
	marbleBlocks: 8,
	acaciaLeaves: 9,
	boards: 10,
	crystals: 11,
	sakuraLeaves: 12,
	spruceLog: 13,
	spruceLeaves: 14,
	birchLog: 15,
	flowerBush: 16,
	dateBush: 17,
	dryGrass: 18,
	roots: 19,
	obsidian: 20,
	oakLog: 21,
	oakLeaves: 22,
	sand: 23,
	seaWater: 24,
};

export const registerBlockTypes = (world: World) => {
	world.blocks.length = 0;
	world.blockTextureUrl = blockTextureUrl;
	blocks.air = world.addBlockType("Air").withInvisible().id;

	blocks.dirt = world
		.addBlockType("Dirt")
		.withTexture(1)
		.withColours(0x311e00ff, 0x412800ff)
		.withMiningCat("Pickaxe")
		.withFireHealth(8000)
		.withBlockHealth(350).id;

	blocks.grass = world
		.addBlockType("Grass")
		.withTexture(16)
		.withTextureTop(0)
		.withTextureBottom(1)
		.withColours(0x003807ff, 0x412800ff)
		.withMiningCat("Pickaxe")
		.withFireDamage(70)
		.withFireHealth(8192 * 2)
		.withFireSpreadToChance(0.047)
		.withSimpleHandler(new BlockItem(world, 1, 1))
		.withBurnHandler((world, x, y, z) => {
			world.setBlock(x, y, z, 1);
		})
		.withBlockHealth(450).id;

	blocks.stone = world
		.addBlockType("Stone")
		.withTexture(2)
		.withColours(0x5e5e5eff, 0x484848ff)
		.withMiningCat("Pickaxe")
		.withItemDropHandler(stoneDropHandler)
		.withFireHealth(8192)
		.withBlockHealth(800).id;

	blocks.coal = world
		.addBlockType("Coal")
		.withTexture(3)
		.withColours(0x262626ff, 0x101010ff)
		.withMiningCat("Pickaxe")
		.withFireDamage(72)
		.withFireHealth(8192 * 16)
		.withItemDropHandler(coalDropHandler)
		.withBlockHealth(700).id;

	blocks.spruceLog = world
		.addBlockType("Spruce log", "SpruceLog")
		.withTexture(4)
		.withColours(0x251b05ff, 0x1d1607ff)
		.withFireDamage(72)
		.withFireHealth(8192 * 8)
		.withMiningCat("Axe")
		.withBlockHealth(600).id;

	blocks.spruceLeaves = world
		.addBlockType("Spruce leaves", "SpruceLeaves")
		.withTexture(5)
		.withColours(0x122c01ff, 0x0f2501ff)
		.withFireDamage(96)
		.withFireHealth(8192 * 2)
		.withMiningCat("Axe")
		.withItemDropHandler(leafDropHandler)
		.withBlockHealth(100).id;

	blocks.dryGrass = world
		.addBlockType("Dry grass", "DryGrass")
		.withTexture(22)
		.withTextureTop(6)
		.withTextureBottom(1)
		.withFireDamage(110)
		.withFireHealth(200)
		.withColours(0x4b6411ff, 0x4f230aff)
		.withMiningCat("Pickaxe")
		.withSimpleHandler(new BlockItem(world, 1, 1))
		.withBlockHealth(200).id;

	blocks.roots = world
		.addBlockType("Roots")
		.withTexture(7)
		.withColours(0x3e3214ff, 0x29200dff)
		.withMiningCat("Pickaxe")
		.withSimpleHandler(new BlockItem(world, 1, 1))
		.withBlockHealth(500).id;

	blocks.obsidian = world
		.addBlockType("Obsidian")
		.withTexture(8)
		.withColours(0x222222ff, 0x171717ff)
		.withMiningCat("Pickaxe")
		.withBlockHealth(1400).id;

	blocks.oakLog = world
		.addBlockType("Oak log", "OakLog")
		.withTexture(9)
		.withColours(0x3c2c08ff, 0x2e2408ff)
		.withFireDamage(72)
		.withFireHealth(8192 * 8)
		.withMiningCat("Axe")
		.withBlockHealth(700).id;

	blocks.oakLeaves = world
		.addBlockType("Oak leaves", "OakLeaves")
		.withTexture(10)
		.withColours(0x274200ff, 0x183300ff)
		.withFireDamage(80)
		.withFireHealth(8192 * 2)
		.withMiningCat("Axe")
		.withItemDropHandler(leafDropHandler)
		.withBlockHealth(100).id;

	blocks.ironOre = world
		.addBlockType("Iron ore", "IronOre")
		.withTexture(11)
		.withColours(0x725b5bff, 0x5e5e5eff)
		.withMiningCat("Pickaxe")
		.withItemDropHandler(ironOreDropHandler)
		.withBlockHealth(1000).id;

	blocks.marbleBlock = world
		.addBlockType("Marble block", "MarbleBlock")
		.withTexture(12)
		.withColours(0xf0f0f0ff, 0xf0f0f0ff)
		.withMiningCat("Pickaxe")
		.withBlockHealth(1000).id;

	blocks.marblePillar = world
		.addBlockType("Marble pillar", "MarblePillar")
		.withTexture(13)
		.withTextureTop(12)
		.withTextureBottom(12)
		.withColours(0xf0f0f0ff, 0xf0f0f0ff)
		.withMiningCat("Pickaxe")
		.withBlockHealth(1000).id;

	blocks.marbleBlocks = world
		.addBlockType("Marble blocks", "MarbleBlocks")
		.withTexture(14)
		.withColours(0xf0f0f0ff, 0xf0f0f0ff)
		.withMiningCat("Pickaxe")
		.withBlockHealth(1000).id;

	blocks.acaciaLeaves = world
		.addBlockType("Acacia leaves", "AcaciaLeaves")
		.withTexture(15)
		.withColours(0x023000ff, 0x326f1cff)
		.withMiningCat("Axe")
		.withFireDamage(96)
		.withItemDropHandler(leafDropHandler)
		.withBlockHealth(100).id;

	blocks.boards = world
		.addBlockType("Boards")
		.withTexture(17)
		.withFireDamage(72)
		.withColours(0x8f6709ff, 0xaf8013ff)
		.withMiningCat("Axe")
		.withBlockHealth(400).id;

	blocks.crystals = world
		.addBlockType("Crystals")
		.withTexture(18)
		.withColours(0xe87c99ff, 0xb5244dff)
		.withMiningCat("Pickaxe")
		.withBlockHealth(2000).id;

	blocks.sakuraLeaves = world
		.addBlockType("Sakura leaves", "SakuraLeaves")
		.withTexture(19)
		.withColours(0xe87c99ff, 0xb5254dff)
		.withMiningCat("Axe")
		.withFireHealth(200)
		.withFireDamage(96)
		.withItemDropHandler(leafDropHandler)
		.withBlockHealth(100).id;

	blocks.birchLog = world
		.addBlockType("Birch log", "BirchLog")
		.withTexture(20)
		.withColours(0x555252ff, 0xa5a2a2ff)
		.withMiningCat("Axe")
		.withBlockHealth(600).id;

	blocks.flowerBush = world
		.addBlockType("Flower bush", "FlowerBush")
		.withTexture(21)
		.withColours(0x274200ff, 0x183300ff)
		.withMiningCat("Axe")
		.withItemDropHandler(leafDropHandler)
		.withBlockHealth(100).id;

	blocks.dateBush = world
		.addBlockType("Date bush", "DateBush")
		.withTexture(23)
		.withColours(0x4f3300ff, 0x948312ff)
		.withMiningCat("Axe")
		.withItemDropHandler(leafDropHandler)
		.withBlockHealth(100).id;

	blocks.sand = world
		.addBlockType("Sand")
		.withTexture(24)
		.withColours(0xecd195ff, 0xd3a748ff)
		.withMiningCat("Pickaxe")
		.withBlockHealth(240).id;

	blocks.seaWater = world
		.addBlockType("Sea Water", "SeaWater")
		.withTexture(25)
		.withColours(0x0036d4ff, 0x0000bdff)
		.withLiquid()
		.withSeeThrough()
		.withItemDropHandler(() => {})
		.withFireDamage(0)
		.withFireHealth(10000)
		.withBlockHealth(340).id;
};
