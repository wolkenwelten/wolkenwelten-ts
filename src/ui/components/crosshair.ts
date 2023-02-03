import styles from './crosshair.module.css';

export class Crosshair {
    div: HTMLElement;

    constructor(parent: HTMLElement) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.crosshair);
        parent.appendChild(this.div);
    }
}
