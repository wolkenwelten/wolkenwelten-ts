/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../game';
import { Server } from './server';

declare global {
	interface Window {
		wow: Game;
	}
}

const main = () => {
	const parent: unknown = null;
	const game = new Game({
		parent: parent as HTMLElement,
	});
	const server = new Server(game);
};
setTimeout(main, 0);
