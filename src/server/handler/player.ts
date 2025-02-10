import type { WSChunkUpdate, WSPlayerUpdate, WSChunkDrop } from "../../network";
import { Chunk } from "../../world/chunk/chunk";
import { ClientConnection } from "../connection";
import { addHandler } from "./handler";

const clientUpdateChunk = (con: ClientConnection, chunk: Chunk): boolean => {
	const clientVersion = con.getChunkVersion(chunk.x, chunk.y, chunk.z);
	const serverVersion = chunk.lastUpdated;

	if (clientVersion == serverVersion) {
		return false;
	} else if (clientVersion > serverVersion) {
		throw new Error(
			"Client has a higher version than the server, this should never happen",
		);
	} else {
		con.setChunkVersion(chunk.x, chunk.y, chunk.z, serverVersion);

		const chunkUpdate: WSChunkUpdate = {
			T: "chunkUpdate",
			x: chunk.x,
			y: chunk.y,
			z: chunk.z,
			lastUpdated: chunk.lastUpdated,
			blocks: chunk.blocks,
		};
		con.send(chunkUpdate);
		return true;
	}
};

const handlePlayerUpdate = (con: ClientConnection, msg: WSPlayerUpdate) => {
	con.x = msg.x;
	con.y = msg.y;
	con.z = msg.z;

	con.yaw = msg.yaw;
	con.pitch = msg.pitch;

	con.health = msg.health;
	con.maxHealth = msg.maxHealth;
};

addHandler("playerUpdate", (con, raw) => {
	handlePlayerUpdate(con, raw as WSPlayerUpdate);

	for (const ccon of con.server.sockets.values()) {
		if (ccon.id === con.id) {
			continue;
		}
		con.send(ccon.getPlayerUpdateMsg());
	}

	for (let ox = -1; ox <= 1; ox++) {
		const x = con.x + ox * 32;
		for (let oy = -1; oy <= 1; oy++) {
			const y = con.y + oy * 32;
			for (let oz = -1; oz <= 1; oz++) {
				const z = con.z + oz * 32;
				const chunk = con.server.game.world.getOrGenChunk(x, y, z);
				if (clientUpdateChunk(con, chunk)) {
					return;
				}
			}
		}
	}
});

addHandler("chunkDrop", (con, raw) => {
	const msg = raw as WSChunkDrop;
	con.setChunkVersion(msg.x, msg.y, msg.z, 0);
});
