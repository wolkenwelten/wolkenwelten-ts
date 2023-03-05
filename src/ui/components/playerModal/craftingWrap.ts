/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../../../game';
import { CraftingRecipe } from '../../../world/crafting';
import { Inventory } from '../../../world/item/inventory';
import { Button, Div, H3, Img, P, Span } from '../../utils';
import { ItemWidget } from '../item/item';
import styles from './craftingWrap.module.css';

export class CraftingWrap {
    div: HTMLElement;
    active = false;
    game: Game;
    inventory: Inventory;
    list: HTMLElement;
    details: HTMLElement;

    constructor(parent: HTMLElement, game: Game) {
        parent.appendChild(
            (this.div = Div({
                class: styles.craftingWrap,
                children: [
                    (this.list = Div({
                        class: styles.recipeList,
                    })),
                    (this.details = Div({
                        class: styles.recipeDetails,
                    })),
                ],
            }))
        );
        this.game = game;
        this.inventory = game.player.inventory;
        this.update();
    }

    showRecipe(recipe: CraftingRecipe) {
        const couldCraft = recipe.couldCraft(this.inventory);
        const that = this;

        this.details.innerHTML = '';
        this.details.appendChild(
            Div({
                class: styles.detailedRecipe,
                children: [
                    H3({ text: recipe.result.name }),
                    recipe.description && P({ text: recipe.description }),
                    Div({
                        class: styles.ingredientList,
                        children: recipe.ingredients.map((ing) => {
                            const wrap = Div({ class: styles.ingredientWrap });
                            const item = new ItemWidget(wrap, false);
                            item.update(ing);
                            return wrap;
                        }),
                    }),
                    Button({
                        classes: [
                            styles.craftButton,
                            couldCraft === 0 && styles.cantCraft,
                        ],
                        onClick: () => {
                            recipe.doCraft(that.inventory);
                            that.update(recipe);
                        },
                    }),
                ],
            })
        );
    }

    update(preselectedRecipe?: CraftingRecipe) {
        const that = this;
        this.list.innerHTML = '';
        let firstRecipe = preselectedRecipe;
        for (const recipe of CraftingRecipe.recipes.values()) {
            const couldCraft = recipe.couldCraft(this.inventory);
            const div = Div({
                classes: [styles.recipe, couldCraft === 0 && styles.cantCraft],
                children: [
                    Img({
                        src: recipe.result.icon,
                    }),
                    H3({ text: recipe.result.name }),
                    Span({
                        class: styles.craftCount,
                        text: String(couldCraft),
                    }),
                ],
                onClick: () => {
                    for (const d of this.list.children) {
                        d.classList.remove(styles.active);
                    }
                    div.classList.add(styles.active);
                    that.showRecipe(recipe);
                },
            });
            this.list.appendChild(div);

            if (!firstRecipe || firstRecipe == recipe) {
                for (const d of this.list.children) {
                    d.classList.remove(styles.active);
                }
                div.classList.add(styles.active);
                firstRecipe = recipe;
            }
        }
        if (firstRecipe) {
            this.showRecipe(firstRecipe);
        }
    }
}
