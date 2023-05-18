/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from '../game';
import { WebSocket, WebSocketServer } from 'ws';
import type { WSChatMessage, WSMessage } from '../network';

export class Server {
    game: Game;
    sockets: Set<WebSocket> = new Set();
    handler: Map<string, (msg: WSMessage) => void> = new Map();

    private addDefaultHandler() {
        const that = this;
        this.handler.set('msg', (raw: WSMessage) => {
            const msg = raw as WSChatMessage;
            console.log(`Chat: ${msg.msg}`);
            that.sendAll(raw);
        });
    }

    sendAll(msg: WSMessage) {
        const m = JSON.stringify(msg);
        for (const s of this.sockets) {
            s.send(m);
        }
    }

    dispatch(msg: WSMessage) {
        const handler = this.handler.get(msg.T);
        if (handler) {
            handler(msg);
        } else {
            console.error(msg);
        }
    }

    constructor(game: Game) {
        this.game = game;
        this.addDefaultHandler();

        let counter = 0;
        const wss = new WebSocketServer({ port: 8080 });
        const that = this;
        wss.on('connection', (socket) => {
            const i = ++counter;
            console.log(`Opening connection #${i}`);
            that.sendAll({
                T: 'msg',
                msg: `Player #${i} joined`,
            } as WSChatMessage);
            that.sockets.add(socket);

            socket.on('message', (msg) => {
                const d = JSON.parse(msg.toString());
                that.dispatch(d);
            });

            socket.on('close', () => {
                console.log(`Closing connection #${i}`);
                that.sockets.delete(socket);
            });
        });

        console.log('Starting WolkenWelten Server');
    }
}
