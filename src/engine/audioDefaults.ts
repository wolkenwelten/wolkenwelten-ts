/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import levelUpUrl from '../../assets/sfx/levelUp.mp3?url';
import pockUrl from '../../assets/sfx/pock.ogg?url';
import punchUrl from '../../assets/sfx/punch.ogg?url';
import punchMissUrl from '../../assets/sfx/punchMiss.ogg?url';
import stepUrl from '../../assets/sfx/step.ogg?url';
import stompUrl from '../../assets/sfx/stomp.ogg?url';
import tockUrl from '../../assets/sfx/tock.ogg?url';
import unghUrl from '../../assets/sfx/ungh.ogg?url';

import { AudioManager } from './audio';

export const addDefaultAudios = () => {
    AudioManager.add('ungh', unghUrl);
    AudioManager.add('pock', pockUrl);
    AudioManager.add('tock', tockUrl);
    AudioManager.add('step', stepUrl);
    AudioManager.add('stomp', stompUrl);
    AudioManager.add('punch', punchUrl);
    AudioManager.add('punchMiss', punchMissUrl);
    AudioManager.add('levelUp', levelUpUrl);
};
