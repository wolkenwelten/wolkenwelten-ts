/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { WebSocket } from 'ws';
import type { Server } from './server';
import type {
    WSChatMessage,
    WSHelloMessage,
    WSMessage,
    WSNameChange,
    WSPlayerUpdate,
} from '../network';

const handler: Map<string, (con: ClientConnection, msg: WSMessage) => void> =
    new Map();
export const addHandler = (
    T: string,
    fun: (con: ClientConnection, msg: WSMessage) => void
) => handler.set(T, fun);

handler.set('msg', (con, raw) => {
    const msg = raw as WSChatMessage;
    console.log(`Chat: ${msg.msg}`);
    con.server.sendAll(raw);
});

handler.set('nameChange', (con, raw) => {
    const msg = raw as WSNameChange;
    con.playerName = msg.newName;
    con.server.sendAll({
        T: 'msg',
        msg: `${con.playerName} joined`,
    } as WSChatMessage);
});

handler.set('playerUpdate', (con, raw) => {
    const msg = raw as WSPlayerUpdate;
    con.x = msg.x;
    con.y = msg.y;
    con.z = msg.z;

    con.yaw = msg.yaw;
    con.pitch = msg.pitch;

    con.health = msg.health;
    con.maxHealth = msg.maxHealth;

    for (const ccon of con.server.sockets.values()) {
        if (ccon.id === con.id) {
            continue;
        }
        con.send(ccon.getPlayerUpdateMsg());
    }
});

let idCounter = 0;
export class ClientConnection {
    private socket: WebSocket;

    id: number;
    playerName = '';
    server: Server;

    x = 0;
    y = 0;
    z = 0;

    yaw = 0;
    pitch = 0;

    health = 10;
    maxHealth = 10;

    getPlayerUpdateMsg(): WSPlayerUpdate {
        return {
            T: 'playerUpdate',
            playerID: this.id,
            playerName: this.playerName,

            x: this.x,
            y: this.y,
            z: this.z,

            yaw: this.yaw,
            pitch: this.pitch,

            health: this.health,
            maxHealth: this.maxHealth,
        };
    }

    constructor(server: Server, socket: WebSocket) {
        this.id = ++idCounter;
        this.socket = socket;
        this.server = server;
        const that = this;

        const helloMsg: WSHelloMessage = {
            T: 'hello',
            playerID: this.id,
        };
        this.send(helloMsg);

        socket.on('close', () => {
            console.log(`Closing connection`);
            server.sockets.delete(that.id);
        });

        socket.on('message', (msg) => {
            try {
                that.dispatch(JSON.parse(msg.toString()));
            } catch (e) {
                console.error(e);
            }
        });
    }

    dispatch(msg: any) {
        const fun = handler.get(msg.T) || console.error;
        fun(this, msg);
    }

    send(msg: WSMessage) {
        this.socket.send(JSON.stringify(msg));
    }
}
