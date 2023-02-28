/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from './game';

export interface PersistentState {
    version: 'stateV1';
    player: {
        x: number;
        y: number;
        z: number;
        yaw: number;
        pitch: number;
    };
}

export class PersistenceManager {
    game: Game;
    lsKey = 'WolkenWeltenState';

    constructor(game: Game) {
        this.game = game;
        setInterval(this.persist.bind(this), 60000);
        addEventListener('beforeunload', this.persist.bind(this));
        this.tryToLoad();
    }

    loadState() {
        const stateRaw = window.localStorage.getItem(this.lsKey);
        if (!stateRaw) {
            return;
        }
        try {
            const stateAny = JSON.parse(stateRaw);
            if (stateAny.version !== 'stateV1') {
                throw 123;
            }
            const state = stateAny as PersistentState;
            this.game.player.x = state.player.x;
            this.game.player.y = state.player.y;
            this.game.player.z = state.player.z;
            this.game.player.yaw = state.player.yaw;
            this.game.player.pitch = state.player.pitch;
        } catch {
            window.localStorage.removeItem(this.lsKey);
        }
    }

    saveState() {
        const player = this.game.player;
        const { x, y, z, yaw, pitch } = player;

        const state: PersistentState = {
            version: 'stateV1',
            player: {
                x,
                y,
                z,
                yaw,
                pitch,
            },
        };
        const stateJson = JSON.stringify(state);
        window.localStorage.setItem(this.lsKey, stateJson);
    }

    persist() {
        //this.saveState();
    }

    tryToLoad() {
        //this.loadState();
    }
}
