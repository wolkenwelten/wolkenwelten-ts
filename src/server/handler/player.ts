import type { WSPlayerUpdate } from "../../network";
import { ClientConnection } from "../connection";
import { addHandler } from "./handler";
import { clientUpdateChunk } from "./chunk";

const handlePlayerUpdate = (con: ClientConnection, msg: WSPlayerUpdate) => {
	con.x = msg.x;
	con.y = msg.y;
	con.z = msg.z;

	con.yaw = msg.yaw;
	con.pitch = msg.pitch;

	con.health = msg.health;
	con.maxHealth = msg.maxHealth;
};

const chunkUpdateLoop = (con: ClientConnection, rMax: number) => {
	// Process chunks in a rough inside-out pattern
	let updates = 0;
	for (let r = 0; r <= rMax; r++) {
		// radius from center
		for (let ox = -r; ox <= r; ox++) {
			for (let oy = -r; oy <= r; oy++) {
				for (let oz = -r; oz <= r; oz++) {
					// Only process blocks at current "shell" radius
					if (Math.abs(ox) !== r && Math.abs(oy) !== r && Math.abs(oz) !== r) {
						continue;
					}

					const x = con.x + ox * 32;
					const y = con.y + oy * 32;
					const z = con.z + oz * 32;

					const chunk = con.server.game.world.getOrGenChunk(x, y, z);
					if (clientUpdateChunk(con, chunk)) {
						if (++updates > 20) {
							break;
						}
					}
				}
			}
		}
	}

	if (updates > 0) {
		console.log(`Sent ${updates} chunk updates`);
	}
};

addHandler("playerUpdate", (con, raw) => {
	handlePlayerUpdate(con, raw as WSPlayerUpdate);

	for (const ccon of con.server.sockets.values()) {
		if (ccon.id === con.id) {
			continue;
		}
		con.send(ccon.getPlayerUpdateMsg());
	}

	if ((++con.updates & 0x1f) == 0) {
		chunkUpdateLoop(con, 5);
	} else {
		chunkUpdateLoop(con, 2);
	}
});
