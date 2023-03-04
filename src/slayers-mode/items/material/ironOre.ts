/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import ironOreIcon from '../../assets/gfx/items/ironOre.png';
import ironOreMesh from '../../assets/vox/items/ironOre.vox?url';

import { Item } from '../../../engine';

export class IronOre extends Item {
    icon = ironOreIcon;
    meshUrl = ironOreMesh;
    name = 'Iron Ore';
    stackSize = 99;
}
