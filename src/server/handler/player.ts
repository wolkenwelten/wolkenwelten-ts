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

addHandler("playerUpdate", (con, raw) => {
	handlePlayerUpdate(con, raw as WSPlayerUpdate);

	for (const ccon of con.server.sockets.values()) {
		if (ccon.id === con.id) {
			continue;
		}
		con.send(ccon.getPlayerUpdateMsg());
	}

	let updates = 0;
	for (let ox = -3; ox <= 3; ox++) {
		const x = con.x + ox * 32;
		for (let oy = -3; oy <= 3; oy++) {
			const y = con.y + oy * 32;
			for (let oz = -3; oz <= 3; oz++) {
				const z = con.z + oz * 32;
				const chunk = con.server.game.world.getOrGenChunk(x, y, z);
				if (clientUpdateChunk(con, chunk)) {
					if (++updates > 60) {
						return;
					}
				}
			}
		}
	}
	if (updates > 0) {
		console.log(`Sent ${updates} chunk updates`);
	}
});
