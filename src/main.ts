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
};
setTimeout(main, 0);
