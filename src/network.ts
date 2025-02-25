/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */

import type { Character } from "./world/entity/character";

export interface WSMessage {
	T: string;
}

export interface WSMultiMessage extends WSMessage {
	T: "multi";
	calls: WSMessage[];
}

export interface WSHelloMessage extends WSMessage {
	T: "hello";
	playerID: number;
}

export interface WSChatMessage extends WSMessage {
	T: "msg";
	playerID: number;
	msg: string;
}

export interface WSNameChange extends WSMessage {
	T: "nameChange";
	playerID: number;
	newName: string;
}

export interface WSPlayerUpdate extends WSMessage {
	T: "playerUpdate";

	playerID: number;
	playerName: string;

	x: number;
	y: number;
	z: number;

	yaw: number;
	pitch: number;

	health: number;
	maxHealth: number;
}

export interface WSChunkDrop extends WSMessage {
	T: "chunkDrop";
	x: number;
	y: number;
	z: number;
}

export interface WSChunkUpdate extends WSMessage {
	T: "chunkUpdate";
	x: number;
	y: number;
	z: number;
	lastUpdated: number;
	blocks: string;
}

export class NetworkManager {
	queue: WSMessage[] = [];
	id = 0;

	send(msg: WSMessage) {
		this.queue.push(msg);
	}

	sendChat(msg: string) {
		const m: WSChatMessage = {
			T: "msg",
			msg,
			playerID: this.id,
		};
		this.send(m);
	}

	sendNameChange(newName: string) {
		const msg: WSNameChange = {
			T: "nameChange",
			newName,
			playerID: this.id,
		};
		this.send(msg);
	}

	sendPlayerUpdate(playerName: string, player: Character) {
		const msg: WSPlayerUpdate = {
			T: "playerUpdate",

			playerID: this.id,
			playerName,

			x: player.x,
			y: player.y,
			z: player.z,

			yaw: player.yaw,
			pitch: player.pitch,

			health: player.health,
			maxHealth: player.maxHealth,
		};
		this.send(msg);
	}

	sendChunkDrop(x: number, y: number, z: number) {
		const msg: WSChunkDrop = {
			T: "chunkDrop",
			x,
			y,
			z,
		};
		this.send(msg);
	}
}
