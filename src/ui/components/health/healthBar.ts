import styles from './healthBar.module.css';
import { Game } from '../../../game';
import { Heart } from './heart';

export class HealthBar {
    div: HTMLElement;
    hearts: Heart[] = [];
    maxHealth = -999;

    constructor(parent: HTMLElement, game: Game) {
        const div = document.createElement('div');
        this.div = div;
        div.classList.add(styles.bar);
        const that = this;
        const player = game.player;
        const updateThis = (e: any) => {
            that.update(player.health, player.maxHealth);
        };
        parent.parentElement?.addEventListener('playerDamage', updateThis);
        parent.parentElement?.addEventListener('playerHeal', updateThis);
        parent.parentElement?.addEventListener('playerDead', updateThis);
        parent.appendChild(div);
        this.update(player.health, player.maxHealth);
    }

    update(health: number, maxHealth: number) {
        if (this.maxHealth !== maxHealth) {
            const heartCount = Math.ceil(maxHealth / 4);
            for (let i = this.hearts.length; i < heartCount; i++) {
                const hp = this.hearts.length * 4;
                this.hearts.push(new Heart(this.div, Math.min(4, health - hp)));
            }
            this.maxHealth = maxHealth;
        }
        for (let i = 0; i < this.hearts.length; i++) {
            const hp = health - i * 4;
            this.hearts[i].update(Math.min(4, hp), hp > 0 && hp <= 4);
        }
    }
}
