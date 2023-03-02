/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './crosshair.module.css';
import { Div } from '../utils';

export class Crosshair {
    div: HTMLElement;

    constructor(parent: HTMLElement) {
        parent.appendChild((this.div = Div({ class: styles.crosshair })));
    }
}
