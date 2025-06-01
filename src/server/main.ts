/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { WebSocketServer } from "ws";
import { ServerGame } from "./serverGame";

const main = async () => {
	const game = new ServerGame();

	const wss = new WebSocketServer({ port: 8080, path: "/ws" });
	const onConnect = game.onConnect.bind(game);
	wss.on("connection", onConnect);
	wss.on("error", (error) => {
		console.error(`(╥﹏╥) WebSocketServer error:`, error);
	});

	wss.on("close", () => {
		console.log(`(｡•́︿•̀｡) WebSocketServer closed`);
	});

	await game.init();
};
main();
