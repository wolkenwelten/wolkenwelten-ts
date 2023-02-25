/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from './game';
import { Howl } from 'howler';

import chompUrl from '../assets/sfx/chomp.ogg?url';
import pockUrl from '../assets/sfx/pock.ogg?url';
import tockUrl from '../assets/sfx/tock.ogg?url';
import stepUrl from '../assets/sfx/step.ogg?url';
import stompUrl from '../assets/sfx/stomp.ogg?url';
import unghUrl from '../assets/sfx/ungh.ogg?url';
import punchUrl from '../assets/sfx/punch.ogg?url';
import heavyStrikeUrl from '../assets/sfx/heavyStrike.mp3?url';
import punchMissUrl from '../assets/sfx/punchMiss.ogg?url';
import levelUpUrl from '../assets/sfx/levelUp.mp3?url';

import crabClickUrl from '../assets/sfx/crabClick.mp3?url';
import crabDeathUrl from '../assets/sfx/crabDeath.mp3?url';

import ratAttackUrl from '../assets/sfx/ratAttack.mp3?url';
import ratDeathUrl from '../assets/sfx/ratDeath.mp3?url';

export class AudioManager {
    game: Game;
    assets: Map<string, string> = new Map();
    volume = 1;

    addDefaultAssets() {
        this.add('chomp', chompUrl);
        this.add('ungh', unghUrl);
        this.add('pock', pockUrl);
        this.add('tock', tockUrl);
        this.add('step', stepUrl);
        this.add('stomp', stompUrl);
        this.add('punch', punchUrl);
        this.add('punchMiss', punchMissUrl);
        this.add('levelUp', levelUpUrl);
        this.add('crabClick', crabClickUrl);
        this.add('crabDeath', crabDeathUrl);
        this.add('ratAttack', ratAttackUrl);
        this.add('ratDeath', ratDeathUrl);
        this.add('heavyStrike', heavyStrikeUrl);
    }

    constructor(game: Game) {
        this.game = game;
        this.addDefaultAssets();
    }

    add(name: string, url: string) {
        this.assets.set(name, url);
        this.play(name, 0);
    }

    play(name: string, localVolume = 1) {
        const url = this.assets.get(name);
        if (!url) {
            throw new Error(`Can't find audio called ${name}`);
        }
        const volume = localVolume * this.volume;
        const howl = new Howl({ src: [url], volume });
        howl.play();
    }
}
