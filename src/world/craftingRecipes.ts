/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { CraftingSystem } from './crafting';
import { BlockItem } from './item/blockItem';
import { Stick } from './item/material/stick';
import { StoneAxe } from './item/tools/stoneAxe';
import { StonePickaxe } from './item/tools/stonePickaxe';
import { World } from './world';

export const addDefaultCraftingRecipes = (
    world: World,
    crafting: CraftingSystem
) => {
    crafting.add('StoneAxe', new StoneAxe(world), [
        new BlockItem(world, 3, 2),
        new Stick(world, 3),
    ]);

    crafting.add('StonePickaxe', new StonePickaxe(world), [
        new BlockItem(world, 3, 3),
        new Stick(world, 3),
    ]);
};
