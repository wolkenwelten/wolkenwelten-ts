/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { CraftingSystem } from './crafting';
import { Stick } from '../item/material/stick';
import { Stone } from '../item/material/stone';
import { IronBar } from '../item/material/ironBar';
import { IronOre } from '../item/material/ironOre';
import { Coal } from '../item/material/coal';
import { StoneAxe } from '../item/tools/stoneAxe';
import { StonePickaxe } from '../item/tools/stonePickaxe';
import { Club } from '../item/weapons/club';
import { IronAxe } from '../item/tools/ironAxe';
import { IronPickaxe } from '../item/tools/ironPickaxe';

import { World } from '../world';

export const addDefaultCraftingRecipes = (
    world: World,
    crafting: CraftingSystem
) => {
    crafting.add(
        'Club',
        new Club(world),
        [new Stick(world, 5)],
        'A simple yet effective weapon.'
    );

    crafting.add(
        'StoneAxe',
        new StoneAxe(world),
        [new Stone(world, 2), new Stick(world, 3)],
        'A simple stone axe, necessary to chop down trees and bushes.'
    );

    crafting.add(
        'StoneAxe',
        new StoneAxe(world),
        [new Stone(world, 2), new Stick(world, 3)],
        'A simple stone axe, necessary to chop down trees and bushes.'
    );

    crafting.add(
        'StonePickaxe',
        new StonePickaxe(world),
        [new Stone(world, 3), new Stick(world, 3)],
        'A simple stone pickaxe, necessary to mine through dirt and stone.'
    );

    crafting.add(
        'IronBar',
        new IronBar(world),
        [new IronOre(world, 2), new Coal(world, 4)],
        'Just a little placeholder recipe until there are proper furnaces.'
    );

    crafting.add(
        'IronAxe',
        new IronAxe(world),
        [new Stick(world, 3), new IronBar(world, 2), new Coal(world, 2)],
        'A much nicer axe, chops through trees pretty quickly and also does a lot of damage.'
    );

    crafting.add(
        'IronPickaxe',
        new IronPickaxe(world),
        [new Stick(world, 3), new IronBar(world, 3), new Coal(world, 2)],
        'An improved pickaxe made from iron, digs much quicker and also does more damage.'
    );
};
