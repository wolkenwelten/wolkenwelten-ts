/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */

import type { Character } from "../world/entity/character";
import type {
	WSBlockUpdate,
	WSChunkDrop,
	WSNameChange,
	WSChatMessage,
	WSPlayerHit,
	WSPlayerUpdate,
	WSMessage,
} from "./messages";

export class NetworkManager {
	id = 0;
	queue: WSMessage[] = [];

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

	sendSetBlock(x: number, y: number, z: number, block: number) {
		const msg: WSBlockUpdate = {
			T: "blockUpdate",
			x,
			y,
			z,
			block,
		};
		this.send(msg);
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

	sendPlayerHit(radius: number, damage: number) {
		const msg: WSPlayerHit = {
			T: "playerHit",
			playerID: this.id,
			radius,
			damage,
		};
		this.send(msg);
	}
}
