/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import ironBarIcon from '../../assets/gfx/items/ironBar.png';
import ironBarMesh from '../../assets/vox/items/ironBar.vox?url';

import { Item } from '../../../engine';

export class IronBar extends Item {
    icon = ironBarIcon;
    meshUrl = ironBarMesh;
    name = 'Iron Bar';
    stackSize = 99;
}
