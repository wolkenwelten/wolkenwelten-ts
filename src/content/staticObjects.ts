/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { StaticObject } from '../world/chunk/staticObject';
import { StaticFlower } from './staticObject/flower';
import { StaticGrass } from './staticObject/grass';
import { StaticShell } from './staticObject/shell';
import { StaticStick } from './staticObject/stick';
import { StaticStone } from './staticObject/stone';

export const registerStaticObjects = () => {
	StaticObject.register('flower', StaticFlower);
	StaticObject.register('grass', StaticGrass);
	StaticObject.register('shell', StaticShell);
	StaticObject.register('stick', StaticStick);
	StaticObject.register('stone', StaticStone);
};
