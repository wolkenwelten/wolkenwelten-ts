/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from './game';
import './style.css';

declare global {
    interface Window {
        wow: Game;
    }
}

const main = () => {
    const parent = document.querySelector('#wolkenwelten-parent');
    if (!parent) {
        throw new Error("Can't find WolkenWelten parent element");
    }
    const game = new Game({
        parent: parent as HTMLElement,
    });
    window.wow = game;
    console.log(
        "%cHello there,%c most of the game state is accessible as the 'wolkenwelten' object, happy hacking! :3",
        'color:green',
        'color:inherit'
    );
};
setTimeout(main, 0);
