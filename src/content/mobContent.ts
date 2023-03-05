/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Mob } from '../world/entity/mob';
import { Crab } from './mob/crab';
import { Rat } from './mob/rat';

export const registerMobs = () => {
    Mob.register('crab', Crab);
    Mob.register('rat', Rat);
};
