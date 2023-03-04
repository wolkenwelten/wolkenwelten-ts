/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import shellIcon from '../../assets/gfx/items/shell.png';
import shellMesh from '../../assets/vox/items/shell.vox?url';

import { Item } from '../../../engine';

export class Shell extends Item {
    icon = shellIcon;
    meshUrl = shellMesh;
    name = 'Shell';
    stackSize = 99;
}
