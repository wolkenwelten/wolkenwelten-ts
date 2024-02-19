/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type {
	WSChatMessage,
	WSMessage,
	WSNameChange,
	WSPlayerUpdate,
} from '../network';
import { ClientConnection } from './connection';

export const handler: Map<string, (con: ClientConnection, msg: WSMessage) => void> =
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
