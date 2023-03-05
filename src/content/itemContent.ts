/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Item } from '../world/item/item';
import { CrabShield } from './armor/crabShield';
import { WoodShield } from './armor/woodShield';
import { CrabMeatRaw } from './food/crabMeatRaw';
import { Coal } from './material/coal';
import { IronBar } from './material/ironBar';
import { IronOre } from './material/ironOre';
import { Shell } from './material/shell';
import { Stick } from './material/stick';
import { Stone } from './material/stone';
import { IronAxe } from './tools/ironAxe';
import { IronPickaxe } from './tools/ironPickaxe';
import { StoneAxe } from './tools/stoneAxe';
import { StonePickaxe } from './tools/stonePickaxe';
import { Club } from './weapons/club';
import { WoodWand } from './weapons/woodWand';

export const registerItems = () => {
    Item.register('crabShield', CrabShield);
    Item.register('woodShield', WoodShield);
    Item.register('crabMeatRaw', CrabMeatRaw);
    Item.register('coal', Coal);
    Item.register('ironBar', IronBar);
    Item.register('ironOre', IronOre);
    Item.register('shell', Shell);
    Item.register('stick', Stick);
    Item.register('stone', Stone);
    Item.register('stoneAxe', StoneAxe);
    Item.register('stonePickaxe', StonePickaxe);
    Item.register('ironAxe', IronAxe);
    Item.register('ironPickaxe', IronPickaxe);
    Item.register('club', Club);
    Item.register('woodWand', WoodWand);
};
