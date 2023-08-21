/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from '../game';
import { WebSocketServer } from 'ws';
import { ClientConnection } from './connection';
import type { WSMessage } from '../network';

export class Server {
    game: Game;
    sockets: Map<number, ClientConnection> = new Map();

    sendAll(msg: WSMessage) {
        for (const s of this.sockets.values()) {
            s.send(msg);
        }
    }

    constructor(game: Game) {
        this.game = game;

        const wss = new WebSocketServer({ port: 8080 });
        const that = this;
        wss.on('connection', (socket) => {
            const con = new ClientConnection(that, socket);
            that.sockets.set(con.id, con);
        });
        console.log('Starting WolkenWelten Server on port 8080');
    }
}
