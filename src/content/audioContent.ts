/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import chompUrl from '../../assets/sfx/chomp.ogg?url';
import crabClickUrl from '../../assets/sfx/crabClick.mp3?url';
import crabDeathUrl from '../../assets/sfx/crabDeath.mp3?url';
import heavyStrikeUrl from '../../assets/sfx/heavyStrike.mp3?url';
import levelUpUrl from '../../assets/sfx/levelUp.mp3?url';
import pockUrl from '../../assets/sfx/pock.ogg?url';
import punchUrl from '../../assets/sfx/punch.ogg?url';
import punchMissUrl from '../../assets/sfx/punchMiss.ogg?url';
import ratAttackUrl from '../../assets/sfx/ratAttack.mp3?url';
import ratDeathUrl from '../../assets/sfx/ratDeath.mp3?url';
import stepUrl from '../../assets/sfx/step.ogg?url';
import stompUrl from '../../assets/sfx/stomp.ogg?url';
import tockUrl from '../../assets/sfx/tock.ogg?url';
import unghUrl from '../../assets/sfx/ungh.ogg?url';

import type { AudioManager } from '../audio';
import '../types';

export const registerAudioContent = (audio: AudioManager) => {
    audio.add('chomp', chompUrl);
    audio.add('ungh', unghUrl);
    audio.add('pock', pockUrl);
    audio.add('tock', tockUrl);
    audio.add('step', stepUrl);
    audio.add('stomp', stompUrl);
    audio.add('punch', punchUrl);
    audio.add('punchMiss', punchMissUrl);
    audio.add('levelUp', levelUpUrl);
    audio.add('crabClick', crabClickUrl);
    audio.add('crabDeath', crabDeathUrl);
    audio.add('ratAttack', ratAttackUrl);
    audio.add('ratDeath', ratDeathUrl);
    audio.add('heavyStrike', heavyStrikeUrl);
};
