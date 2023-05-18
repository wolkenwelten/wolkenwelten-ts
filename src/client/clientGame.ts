/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from '../game';
import type { WSMessage, WSChatMessage } from '../network';

export class ClientGame {
    game: Game;
    private ws?: WebSocket;
    private handler: Map<string, (msg: WSMessage) => void> = new Map();

    constructor(game: Game) {
        this.game = game;
        this.connect();
        this.addDefaultHandler();
        setInterval(this.transfer.bind(this), 8);
    }

    private addDefaultHandler() {
        const game = this.game;
        this.setHandler('msg', (raw: WSMessage) => {
            const msg = raw as WSChatMessage;
            game.ui.log.addEntry(msg.msg);
        });
    }

    private setHandler(T: string, handler: (msg: WSMessage) => void) {
        this.handler.set(T, handler);
    }

    private connect() {
        if (this.ws) {
            this.ws.close();
        }
        this.ws = new WebSocket('ws://localhost:8080');
        const that = this;
        this.ws.onmessage = (ev) => {
            const raw = ev.data || '';
            const msg = JSON.parse(raw);
            if (typeof msg.T !== 'string') {
                console.error(msg);
                throw new Error('Invalid message received');
            }
            that.dispatch(msg);
        };
        this.ws.onclose = () => {
            that.ws = undefined;
        };
    }

    private dispatch(msg: WSMessage) {
        const handler = this.handler.get(msg.T);
        if (!handler) {
            console.error('Received unknown Message:');
            console.error(msg);
        } else {
            handler(msg);
        }
    }

    private transfer() {
        if (!this.ws) {
            this.connect();
            return;
        }
        if (this.game.network.queue.length === 0) {
            return;
        }

        for (const m of this.game.network.queue) {
            this.ws.send(JSON.stringify(m));
        }
        this.game.network.queue.length = 0;
    }
}
