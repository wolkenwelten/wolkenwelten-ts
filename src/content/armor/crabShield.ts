/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import itemIcon from '../../../assets/gfx/items/crabShield.png';
import meshUrl from '../../../assets/vox/items/crabShield.vox?url';

import { Item } from '../../world/item/item';

export class CrabShield extends Item {
    name = 'Crab shield';
    icon = itemIcon;
    meshUrl = meshUrl;
    isShield = true;
}
