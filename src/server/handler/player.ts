import type { WSChunkUpdate, WSPlayerUpdate } from "../../network";
import { Chunk } from "../../world/chunk/chunk";
import { ClientConnection } from "../connection";
import { addHandler } from "./handler";

const clientUpdateChunk = (con: ClientConnection, chunk: Chunk) => {
	const chunkUpdate: WSChunkUpdate = {
		T: "chunkUpdate",
		x: chunk.x,
		y: chunk.y,
		z: chunk.z,
		lastUpdated: chunk.lastUpdated,
		blocks: chunk.blocks,
	};
	con.send(chunkUpdate);
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

	const chunk = con.server.game.world.getOrGenChunk(con.x, con.y, con.z);
	clientUpdateChunk(con, chunk);

	for (const ccon of con.server.sockets.values()) {
		if (ccon.id === con.id) {
			continue;
		}
		con.send(ccon.getPlayerUpdateMsg());
	}
});
