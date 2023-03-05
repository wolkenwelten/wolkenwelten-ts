/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Mob } from '../../engine';
import { Crab } from './crab';
import { Rat } from './rat';

export const addDefaultMobs = () => {
    Mob.register('crab', Crab);
    Mob.register('rat', Rat);
};
