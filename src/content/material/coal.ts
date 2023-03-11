/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/coal.png';
import meshUrl from '../../../assets/vox/items/coal.vox?url';

import { Item } from '../../world/item/item';

export class Coal extends Item {
    name = 'Coal';
    icon = itemIcon;
    meshUrl = meshUrl;
    stackSize = 99;
}
