/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/shell.png';
import meshUrl from '../../../assets/vox/items/shell.vox?url';

import { Item } from '../../world/item/item';

export class Shell extends Item {
    name = 'Shell';
    icon = itemIcon;
    meshUrl = meshUrl;
    stackSize = 99;
}
