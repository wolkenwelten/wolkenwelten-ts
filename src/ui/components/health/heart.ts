import styles from './heart.module.css';

export class Heart {
    div: HTMLElement;
    hp = -999;
    animate = false;

    constructor(parent: HTMLElement, hp: number) {
        const div = document.createElement('div');
        this.div = div;
        div.classList.add(styles.heart);
        parent.appendChild(div);
        this.update(hp, false);
    }

    update(hp: number, animate: boolean) {
        if (this.hp !== hp) {
            this.div.setAttribute('hp-val', String(hp));
            this.hp = hp;
        }
        if (this.animate !== animate) {
            if (animate) {
                this.div.classList.add(styles.animate);
            } else {
                this.div.classList.remove(styles.animate);
            }
            this.animate = animate;
        }
    }
}
