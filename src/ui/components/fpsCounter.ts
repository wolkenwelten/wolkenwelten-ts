import styles from './fpsCounter.module.css';
import { Game } from '../../game';

export class FpsCounter {
    div: HTMLElement;

    constructor(parent: HTMLElement, game: Game) {
        const div = document.createElement('div');
        this.div = div;
        div.classList.add(styles.fps);
        setInterval(() => {
            div.innerText = `FPS: ${game.render.fps}`;
        }, 1000);
        parent.appendChild(div);
    }
}
