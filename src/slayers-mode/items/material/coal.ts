/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import coalIcon from '../../assets/gfx/items/coal.png';
import coalMesh from '../../assets/vox/items/coal.vox?url';

import { Item } from '../../../engine';

export class Coal extends Item {
    icon = coalIcon;
    meshUrl = coalMesh;
    name = 'Coal';
    stackSize = 99;
}
