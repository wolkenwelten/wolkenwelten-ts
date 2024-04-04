/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Item } from '../world/item/item';

import { Stick } from './weapons/stick';
import { Club } from './weapons/club';

import { EarthBullet } from './runes/earthBullet';
import { EarthWall } from './runes/earthWall';
import { FireBreath } from './runes/fireBreath';
import { Comet } from './runes/comet';

import { Stone } from './consumables/stone';

export const registerItems = () => {
	Item.register('stick', Stick);
	Item.register('club', Club);

	Item.register('earthBullet', EarthBullet);
	Item.register('earthWall', EarthWall);
	Item.register('fireBreath', FireBreath);
	Item.register('comet', Comet);

	Item.register('stone', Stone);
};
