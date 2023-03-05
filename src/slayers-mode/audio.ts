/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import chompUrl from './assets/sfx/chomp.ogg?url';
import crabClickUrl from './assets/sfx/crabClick.mp3?url';
import crabDeathUrl from './assets/sfx/crabDeath.mp3?url';
import heavyStrikeUrl from './assets/sfx/heavyStrike.mp3?url';
import ratAttackUrl from './assets/sfx/ratAttack.mp3?url';
import ratDeathUrl from './assets/sfx/ratDeath.mp3?url';
import shotUrl from './assets/sfx/shot.mp3?url';

import { AudioManager } from '../engine';

export const addAudioContent = () => {
    AudioManager.add('chomp', chompUrl);
    AudioManager.add('crabClick', crabClickUrl);
    AudioManager.add('crabDeath', crabDeathUrl);
    AudioManager.add('ratAttack', ratAttackUrl);
    AudioManager.add('ratDeath', ratDeathUrl);
    AudioManager.add('heavyStrike', heavyStrikeUrl);
    AudioManager.add('shot', shotUrl);
};
