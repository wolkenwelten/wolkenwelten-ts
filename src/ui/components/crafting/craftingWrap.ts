/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Inventory } from '../../../world/item/inventory';
import styles from './craftingWrap.module.css';
import { Game } from '../../../game';
import { CraftingRecipe } from '../../../world/crafting';
import { ItemWidget } from '../item/item';

export class CraftingWrap {
    div: HTMLElement;
    active = false;
    game: Game;
    inventory: Inventory;
    list: HTMLElement;
    details: HTMLElement;

    constructor(parent: HTMLElement, inventory: Inventory, game: Game) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.craftingWrap);

        this.list = document.createElement('div');
        this.list.classList.add(styles.recipeList);
        this.div.appendChild(this.list);

        this.details = document.createElement('div');
        this.details.classList.add(styles.recipeDetails);
        this.div.appendChild(this.details);

        this.game = game;
        this.inventory = inventory;
        this.update();
        parent.appendChild(this.div);
    }

    showRecipe(recipe: CraftingRecipe) {
        this.details.innerHTML = '';
        const couldCraft = recipe.couldCraft(this.inventory);
        const that = this;

        const div = document.createElement('div');
        div.classList.add(styles.detailedRecipe);

        const h = document.createElement('h3');
        h.innerText = recipe.result.name;
        div.append(h);

        if (recipe.description) {
            const p = document.createElement('p');
            p.innerText = recipe.description;
            div.append(p);
        }

        const ingredients = document.createElement('div');
        ingredients.classList.add(styles.ingredientList);
        div.append(ingredients);

        for (const ing of recipe.ingredients) {
            const wrap = document.createElement('div');
            wrap.classList.add(styles.ingredientWrap);
            ingredients.append(wrap);

            const item = new ItemWidget(wrap, false);
            item.update(ing);
        }

        const craft = document.createElement('button');
        craft.classList.add(styles.craftButton);
        div.append(craft);

        if (couldCraft === 0) {
            craft.classList.add(styles.cantCraft);
        }

        craft.onclick = () => {
            recipe.doCraft(that.inventory);
            that.update(recipe);
        };

        this.details.appendChild(div);
    }

    update(preselectedRecipe?: CraftingRecipe) {
        const that = this;
        this.list.innerHTML = '';
        let firstRecipe = preselectedRecipe;
        for (const recipe of this.game.world.crafting.recipes.values()) {
            const couldCraft = recipe.couldCraft(this.inventory);
            const div = document.createElement('div');
            div.classList.add(styles.recipe);

            const img = document.createElement('img');
            img.setAttribute('src', recipe.result.icon());
            div.append(img);

            const h = document.createElement('h3');
            h.innerText = recipe.result.name;
            div.append(h);

            const count = document.createElement('span');
            count.innerText = String(couldCraft);
            count.classList.add(styles.craftCount);
            div.append(count);

            if (couldCraft === 0) {
                div.classList.add(styles.cantCraft);
            }

            div.onclick = () => {
                for (const d of this.list.children) {
                    d.classList.remove(styles.active);
                }
                div.classList.add(styles.active);
                that.showRecipe(recipe);
            };

            if (!firstRecipe || firstRecipe == recipe) {
                for (const d of this.list.children) {
                    d.classList.remove(styles.active);
                }
                div.classList.add(styles.active);
                firstRecipe = recipe;
            }

            this.list.appendChild(div);
        }
        if (firstRecipe) {
            this.showRecipe(firstRecipe);
        }
    }
}
