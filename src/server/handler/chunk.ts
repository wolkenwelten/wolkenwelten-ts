import type { WSChunkDrop, WSChunkUpdate } from "../../network";
import type { Chunk } from "../../world/chunk/chunk";
import type { ClientConnection } from "../connection";

import { addHandler } from "./handler";

export const clientUpdateChunk = (
	con: ClientConnection,
	chunk: Chunk,
): boolean => {
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

addHandler("chunkDrop", (con, raw) => {
	const msg = raw as WSChunkDrop;
	con.setChunkVersion(msg.x, msg.y, msg.z, 0);
});
