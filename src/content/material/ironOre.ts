/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/ironOre.png';
import meshUrl from '../../../assets/vox/items/ironOre.vox?url';

import { Item } from '../../world/item/item';

export class IronOre extends Item {
    name = 'Iron ore';
    icon = itemIcon;
    meshUrl = meshUrl;
}
