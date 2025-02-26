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
