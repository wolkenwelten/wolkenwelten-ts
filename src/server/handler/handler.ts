import type { WSMessage } from "../../network";
import type { ClientConnection } from "../connection";

export const handler: Map<
	string,
	(con: ClientConnection, msg: WSMessage) => void
> = new Map();

export const addHandler = (
	T: string,
	fun: (con: ClientConnection, msg: WSMessage) => void,
) => handler.set(T, fun);
