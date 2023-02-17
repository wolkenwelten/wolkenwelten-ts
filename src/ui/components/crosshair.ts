/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './crosshair.module.css';

export class Crosshair {
    div: HTMLElement;

    constructor(parent: HTMLElement) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.crosshair);
        parent.appendChild(this.div);
    }
}
