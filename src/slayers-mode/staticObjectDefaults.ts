/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { StaticObject } from '../engine';
import {
    StaticFlower,
    StaticGrass,
    StaticShell,
    StaticStick,
    StaticStone,
} from './staticObjects';

export const addDefaultStaticObjects = () => {
    StaticObject.register('flower', StaticFlower);
    StaticObject.register('grass', StaticGrass);
    StaticObject.register('shell', StaticShell);
    StaticObject.register('stick', StaticStick);
    StaticObject.register('stone', StaticStone);
};
