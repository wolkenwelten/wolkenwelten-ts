/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */

export interface WSMessage {
    T: string;
}

export interface WSChatMessage extends WSMessage {
    msg: string;
}

export class NetworkManager {
    queue: WSMessage[] = [];

    send(msg: WSMessage) {
        this.queue.push(msg);
    }

    sendChat(msg: string) {
        this.send({
            T: 'msg',
            msg,
        } as WSChatMessage);
    }
}
