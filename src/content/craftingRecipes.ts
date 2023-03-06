/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { World } from '../world/world';
import { CraftingRecipe } from '../world/crafting';
import { Item } from '../world/item/item';

export const registerCraftingRecipes = (world: World) => {
    CraftingRecipe.register(
        'Club',
        Item.create('club', world),
        [Item.create('stick', world, 5)],
        'A simple yet effective weapon.'
    );

    CraftingRecipe.register(
        'Wood wand',
        Item.create('woodWand', world),
        [Item.create('stick', world, 3)],
        'The weapon of choice for beginning magicians.'
    );

    CraftingRecipe.register(
        'WoodShield',
        Item.create('woodShield', world),
        [Item.create('stick', world, 8)],
        'A primitive shield.'
    );

    CraftingRecipe.register(
        'StoneAxe',
        Item.create('stoneAxe', world),
        [Item.create('stone', world, 2), Item.create('stick', world, 3)],
        'A simple stone axe, necessary to chop down trees and bushes.'
    );

    CraftingRecipe.register(
        'StoneAxe',
        Item.create('stoneAxe', world),
        [Item.create('stone', world, 2), Item.create('stick', world, 3)],
        'A simple stone axe, necessary to chop down trees and bushes.'
    );

    CraftingRecipe.register(
        'StonePickaxe',
        Item.create('stonePickaxe', world),
        [Item.create('stone', world, 3), Item.create('stick', world, 3)],
        'A simple stone pickaxe, necessary to mine through dirt and stone.'
    );

    CraftingRecipe.register(
        'IronBar',
        Item.create('ironBar', world),
        [Item.create('ironOre', world, 2), Item.create('coal', world, 4)],
        'Just a little placeholder recipe until there are proper furnaces.'
    );

    CraftingRecipe.register(
        'IronAxe',
        Item.create('ironAxe', world),
        [
            Item.create('stick', world, 3),
            Item.create('ironBar', world, 2),
            Item.create('coal', world, 2),
        ],
        'A much nicer axe, chops through trees pretty quickly and also does a lot of damage.'
    );

    CraftingRecipe.register(
        'IronPickaxe',
        Item.create('ironPickaxe', world),
        [
            Item.create('stick', world, 3),
            Item.create('ironBar', world, 3),
            Item.create('coal', world, 2),
        ],
        'An improved pickaxe made from iron, digs much quicker and also does more damage.'
    );

    CraftingRecipe.register(
        'CrabShield',
        Item.create('crabShield', world),
        [Item.create('crabMeatRaw', world, 8)],
        'A buckler made from the hard armored shell of the local crab populace.'
    );
};
