/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { ClientGame } from "./client/clientGame";
import "./style.css";

declare global {
	interface Window {
		wow: ClientGame;
	}
}

const main = () => {
	const parent = document.querySelector("#wolkenwelten-parent");
	if (!parent) {
		throw new Error("Can't find WolkenWelten parent element");
	}
	const game = new ClientGame({
		parent: parent as HTMLElement,
	});
	window.wow = game;
	console.log(
		"%cHello there,%c most of the game state is accessible as the 'wow' object, happy hacking! :3",
		"color:green",
		"color:inherit",
	);
};
setTimeout(main, 0);
