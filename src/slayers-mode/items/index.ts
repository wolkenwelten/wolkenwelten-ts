/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Item } from '../../engine';
import { CrabShield, WoodShield } from './armor';
import { CrabMeatRaw } from './food';
import { Coal, IronBar, IronOre, Shell, Stick, Stone } from './material';
import { IronAxe, IronPickaxe, StoneAxe, StonePickaxe } from './tools';
import { Club, WoodWand } from './weapons';

export {
    CrabShield,
    WoodShield,
    CrabMeatRaw,
    Coal,
    IronBar,
    IronOre,
    Shell,
    Stick,
    Stone,
    StoneAxe,
    StonePickaxe,
    IronAxe,
    IronPickaxe,
    Club,
    WoodWand,
};

export const addDefaultItems = () => {
    Item.register('crabShield', CrabShield);
    Item.register('woodShield', WoodShield);
    Item.register('crabMeatRaw', CrabMeatRaw);
    Item.register('coal', Coal);
    Item.register('ironBar', IronBar);
    Item.register('ironOre', IronOre);
    Item.register('shell', Shell);
    Item.register('stick', Stick);
    Item.register('stone', Stone);
    Item.register('ironAxe', IronAxe);
    Item.register('ironPickaxe', IronPickaxe);
    Item.register('stoneAxe', StoneAxe);
    Item.register('stonePickaxe', StonePickaxe);
    Item.register('club', Club);
    Item.register('woodWand', WoodWand);
};
