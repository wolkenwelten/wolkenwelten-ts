/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../engine';
import { GameConfig } from '../engine/game';
import { addAudioContent } from './audioContent';
import { addDefaultBlockTypes } from './blockTypeContent';
import { addDefaultCraftingRecipes } from './craftingRecipes';
import { addDefaultItems } from './itemContent';
import { addDefaultMobs } from './mobContent';
import { addDefaultSkills } from './skillContent';
import { addDefaultStaticObjects } from './staticObjectDefaults';
import { SlayersWorldgen } from './worldgen/assets';

export class SlayersGame extends Game {
    worldgenAssets: SlayersWorldgen;

    constructor(config: GameConfig) {
        super(config);
        this.worldgenAssets = new SlayersWorldgen();
    }

    addContent() {
        addDefaultItems();
        addDefaultBlockTypes(this.world);
        addDefaultCraftingRecipes(this.world);
        addDefaultSkills();
        addAudioContent();
        addDefaultStaticObjects();
        addDefaultMobs();
    }

    async init() {
        this.world.worldgenHandler = await this.worldgenAssets.init();
        this.ready = true;
    }
}
