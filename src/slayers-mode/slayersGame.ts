/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../engine';
import { addAudioContent } from './audioContent';
import { addDefaultBlockTypes } from './blockTypeContent';
import { addDefaultCraftingRecipes } from './craftingRecipes';
import { addDefaultItems } from './itemContent';
import { addDefaultMobs } from './mobContent';
import { addDefaultSkills } from './skillContent';
import { addDefaultStaticObjects } from './staticObjectDefaults';

export class SlayersGame extends Game {
    addContent() {
        addDefaultItems();
        addDefaultBlockTypes(this.world);
        addDefaultCraftingRecipes(this.world);
        addDefaultSkills();
        addAudioContent();
        addDefaultStaticObjects();
        addDefaultMobs();
    }
}
