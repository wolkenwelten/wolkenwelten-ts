/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/woodShield.png';
import meshUrl from '../../../assets/vox/items/woodShield.vox?url';

import { Item } from '../../world/item/item';

export class WoodShield extends Item {
    isShield = true;
    icon = itemIcon;
    meshUrl = meshUrl;
}
