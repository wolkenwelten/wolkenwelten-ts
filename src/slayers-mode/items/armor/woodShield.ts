/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import woodShieldIcon from '../../assets/gfx/items/woodShield.png';
import woodShieldMesh from '../../assets/vox/items/woodShield.vox?url';

import { Item } from '../../../engine';

export class WoodShield extends Item {
    isShield = true;
    icon = woodShieldIcon;
    meshUrl = woodShieldMesh;
    name = 'Wood shield';
}
