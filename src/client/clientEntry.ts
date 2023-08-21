/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from '../game';
import type { WSPlayerUpdate } from '../network';
import { Character } from '../world/entity/character';

export class ClientEntry {
    id: number;
    name = '';

    char: Character;

    constructor(game: Game, id: number) {
        this.id = id;
        this.char = new Character(game.world, 0, 0, 0, 0, 0);
    }

    update(msg: WSPlayerUpdate) {
        this.name = msg.playerName;

        this.char.x = msg.x;
        this.char.y = msg.y;
        this.char.z = msg.z;

        this.char.yaw = msg.yaw;
        this.char.pitch = msg.pitch;

        this.char.health = msg.health;
        this.char.maxHealth = msg.maxHealth;
    }
}
