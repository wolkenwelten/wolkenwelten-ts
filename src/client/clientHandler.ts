/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { ClientNetwork } from "./clientNetwork";

ClientNetwork.addDefaultHandler("msg", async (client, args) => {
	if (Array.isArray(args) && args.length > 0) {
		const msg = args[0] as string;
		client.game.ui.log.addEntry(msg);
	}
});

ClientNetwork.addDefaultHandler("hello", async (client, args) => {
	if (Array.isArray(args) && args.length > 0) {
		const id = args[0] as number;
		client.game.network.id = id;
	}
});
