/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Item } from '../world/item/item';
import { Stick } from './weapons/stick';
import { Club } from './weapons/club';

export const registerItems = () => {
    Item.register('stick', Stick);
    Item.register('club', Club);
};
