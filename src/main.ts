import './style.css';
import { Game } from './game';

const main = () => {
    const parent = document.querySelector('#wolkenwelten-parent');
    if (!parent) {
        throw new Error("Can't find WolkenWelten parent element");
    }
    new Game({
        parent: parent as HTMLElement,
    });
};
setTimeout(main, 0);
