/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import crabShieldIcon from '../../assets/gfx/items/crabShield.png';
import crabShieldMesh from '../../assets/vox/items/crabShield.vox?url';

import { Item } from '../../../engine';

export class CrabShield extends Item {
    isShield = true;
    icon = crabShieldIcon;
    meshUrl = crabShieldMesh;
    name = 'Crab shield';
}
