import { Game } from './game';
import { Howl } from 'howler';

import pockUrl from '../assets/sfx/pock.ogg?url';
import tockUrl from '../assets/sfx/tock.ogg?url';
import stepUrl from '../assets/sfx/step.ogg?url';
import stompUrl from '../assets/sfx/stomp.ogg?url';

export class AudioManager {
    game: Game;
    assets: Map<string, string> = new Map();

    addDefaultAssets() {
        this.add('pock', pockUrl);
        this.add('tock', tockUrl);
        this.add('step', stepUrl);
        this.add('stomp', stompUrl);
    }

    constructor(game: Game) {
        this.game = game;
        this.addDefaultAssets();
    }

    add(name: string, url: string) {
        this.assets.set(name, url);
    }

    play(name: string, volume = 1) {
        const url = this.assets.get(name);
        if (!url) {
            throw new Error(`Can't find audio called ${name}`);
        }
        const howl = new Howl({ src: [url], volume });
        howl.play();
    }
}
