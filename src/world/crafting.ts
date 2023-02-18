/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { addDefaultCraftingRecipes } from './craftingRecipes';
import { Inventory } from './item/inventory';
import { Item } from './item/item';
import { World } from './world';

export class CraftingRecipe {
    result: Item;
    ingredients: Item[];
    description: string;

    constructor(result: Item, ingredients: Item[], description = '') {
        this.result = result;
        this.ingredients = ingredients;
        this.description = description;
    }

    couldCraft(inventory: Inventory): number {
        return this.ingredients
            .map((i) => inventory.countItem(i))
            .reduce((a: number, b: number) => Math.min(a, b));
    }

    doCraft(inventory: Inventory) {
        const could = this.couldCraft(inventory);
        if (could <= 0) {
            return;
        }
        for (const ing of this.ingredients) {
            inventory.remove(ing);
        }
        inventory.add(this.result.clone());
    }
}

export class CraftingSystem {
    world: World;
    recipes: Map<string, CraftingRecipe> = new Map();

    add(id: string, result: Item, ingredients: Item[], description = '') {
        this.recipes.set(
            id,
            new CraftingRecipe(result, ingredients, description)
        );
    }

    constructor(world: World) {
        this.world = world;
        addDefaultCraftingRecipes(world, this);
    }
}
