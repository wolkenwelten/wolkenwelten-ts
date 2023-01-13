import './style.css';
import './game.css';

import { Game, GameConfig } from "./game";

const main = () => {
    const parent = document.querySelector("#wolkenwelten-parent");
    if(!parent){throw new Error("Can't find WolkenWelten parent element")};
    const config: GameConfig = {
        parent: parent as HTMLElement,
    };
    const game = new Game(config);
};
setTimeout(main, 0);
