/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { ServerGame } from "./serverGame";

const main = async () => {
	const parent: unknown = null;
	const game = new ServerGame({
		parent: parent as HTMLElement,
	});
	await game.init();
};
setTimeout(main, 0);
