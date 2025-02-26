/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */

export interface WSCall {
	T: string;
	id: number;
	args: unknown[];
}

export interface WSReply {
	T: string;
	id: number;
	value: unknown;
	error: string;
}

export interface WSPacket {
	T: "packet";
	calls: WSCall[];
	replies: WSReply[];
}

export interface WSMessage {
	T: string;
}

export interface WSMultiMessage extends WSMessage {
	T: "multi";
	calls: WSMessage[];
}

export interface WSBlockUpdate extends WSMessage {
	T: "blockUpdate";
	x: number;
	y: number;
	z: number;
	block: number;
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

export interface WSPlayerHit extends WSMessage {
	T: "playerHit";
	playerID: number;
	radius: number;
	damage: number;
}
