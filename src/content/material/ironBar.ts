/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/ironBar.png';
import meshUrl from '../../../assets/vox/items/ironBar.vox?url';

import { Item } from '../../world/item/item';

export class IronBar extends Item {
    name = 'Iron bar';
    icon = itemIcon;
    meshUrl = meshUrl;
}
