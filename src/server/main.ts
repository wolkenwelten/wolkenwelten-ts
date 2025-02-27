/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { ServerGame } from "./server";

const main = () => {
	const parent: unknown = null;
	new ServerGame({
		parent: parent as HTMLElement,
	});
};
setTimeout(main, 0);
