/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Div } from '../utils';
import styles from './crosshair.module.css';

export class Crosshair {
    div: HTMLElement;

    constructor(parent: HTMLElement) {
        parent.appendChild((this.div = Div({ class: styles.crosshair })));
    }
}
