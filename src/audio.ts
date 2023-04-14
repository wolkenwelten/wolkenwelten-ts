/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Howl, Howler } from 'howler';
import type { Entity } from './world/entity/entity';

export class AudioManager {
    assets: Map<string, string> = new Map();
    emitters: Set<AudioEmitter> = new Set();

    add(name: string, url: string) {
        this.assets.set(name, url);
        this.play(name, 0);
    }

    play(name: string, volume = 1) {
        this.emitters.add(new AudioEmitter(this, name, volume, [0, 0, 0]));
    }

    playFromEntity(name: string, volume = 1, entity: Entity) {
        this.emitters.add(new AudioEmitter(this, name, volume, entity));
    }

    playAtPosition(
        name: string,
        volume = 1,
        position: [number, number, number]
    ) {
        this.emitters.add(new AudioEmitter(this, name, volume, position));
    }

    update(listener: Entity) {
        Howler.pos(listener.x, listener.y, listener.z);
        const [x, y, z] = listener.direction(0, 0, -1);
        const [xUp, yUp, zUp] = listener.direction(0, 1, 0);
        Howler.orientation(x, y, z, xUp, yUp, zUp);

        for (const emitter of this.emitters) {
            emitter.update();
        }
    }

    setVolume(volume: number) {
        Howler.volume(volume);
    }
}

export class AudioEmitter {
    x: number;
    y: number;
    z: number;
    entity?: Entity;

    manager: AudioManager;
    howl: Howl;

    constructor(
        manager: AudioManager,
        name: string,
        volume = 1.0,
        position: Entity | [number, number, number]
    ) {
        this.manager = manager;
        if (Array.isArray(position)) {
            this.x = position[0];
            this.y = position[1];
            this.z = position[2];
        } else {
            this.entity = position;
            this.x = position.x;
            this.y = position.y;
            this.z = position.z;
        }
        const url = manager.assets.get(name);
        if (!url) {
            throw new Error(`Can't find audio called ${name}`);
        }

        const destroy = this.destroy.bind(this);
        this.howl = new Howl({ src: [url], volume });
        this.howl.on('end', destroy);
        this.howl.on('stop', destroy);
        this.howl.on('playerror', destroy);
        this.howl.on('loaderror', destroy);
        this.howl.pos(this.x, this.y, this.z);
        this.howl.play();
    }

    destroy() {
        this.entity = undefined;
        this.howl.stop();
        this.manager.emitters.delete(this);
    }

    update() {
        if (this.entity) {
            if (this.entity.destroyed) {
                this.entity = undefined;
            } else {
                this.x = this.entity.x;
                this.y = this.entity.y;
                this.z = this.entity.z;
            }
        }
        this.howl.pos(this.x, this.y, this.z);
    }
}
