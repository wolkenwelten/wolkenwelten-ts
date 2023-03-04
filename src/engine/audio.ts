/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Howl } from 'howler';

export class AudioManager {
    static assets: Map<string, string> = new Map();
    volume = 1;

    static add(name: string, url: string) {
        this.assets.set(name, url);
    }

    play(name: string, localVolume = 1) {
        const url = AudioManager.assets.get(name);
        if (!url) {
            throw new Error(`Can't find audio called ${name}`);
        }
        const volume = localVolume * this.volume;
        const howl = new Howl({ src: [url], volume });
        howl.play();
    }
}
