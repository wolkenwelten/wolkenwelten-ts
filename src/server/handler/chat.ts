import type { WSNameChange, WSChatMessage } from "../../network";
import { addHandler } from "./handler";

addHandler("msg", (con, raw) => {
	const msg = raw as WSChatMessage;
	console.log(`Chat: ${msg.msg}`);
	con.server.sendAll(raw);
});

addHandler("nameChange", (con, raw) => {
	const msg = raw as WSNameChange;
	con.playerName = msg.newName;
	con.server.sendAll({
		T: "msg",
		msg: `${con.playerName} joined`,
	} as WSChatMessage);
});
