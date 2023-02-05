import './style.css';
import { Game } from './game';

declare global {
    interface Window {
        wolkenwelten: Game;
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
    window.wolkenwelten = game;
    console.log(
        "%cHello there,%c most of the game state is accessible as the 'wolkenwelten' object, happy hacking! :3",
        'color:green',
        'color:inherit'
    );
};
setTimeout(main, 0);
