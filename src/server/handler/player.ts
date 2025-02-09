import type { WSPlayerUpdate } from "../../network";
import { addHandler } from "./handler";

addHandler("playerUpdate", (con, raw) => {
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
