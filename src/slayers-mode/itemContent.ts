/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Item } from '../engine';
import {
    Club,
    Coal,
    CrabMeatRaw,
    CrabShield,
    IronAxe,
    IronBar,
    IronOre,
    IronPickaxe,
    Shell,
    Stick,
    Stone,
    StoneAxe,
    StonePickaxe,
    WoodShield,
    WoodWand,
} from './items';

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
