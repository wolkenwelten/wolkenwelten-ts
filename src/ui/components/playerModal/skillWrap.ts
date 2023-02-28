/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import styles from './skillWrap.module.css';
import { Game } from '../../../game';
import { ActiveSkill, Skill } from '../../../world/skill/skill';

interface ListElementEntry {
    div: HTMLElement;
    level: HTMLElement;
    xpBar: HTMLElement;
    xpCount: HTMLElement;
}

export class SkillWrap {
    div: HTMLElement;
    active = false;
    game: Game;
    list: HTMLElement;
    details: HTMLElement;

    shownSkill?: Skill;
    selectButton?: HTMLElement;

    listElement: Map<string, ListElementEntry> = new Map();

    constructor(parent: HTMLElement, game: Game) {
        this.div = document.createElement('div');
        this.div.classList.add(styles.skillWrap);

        this.list = document.createElement('div');
        this.list.classList.add(styles.skillList);
        this.div.appendChild(this.list);

        this.details = document.createElement('div');
        this.details.classList.add(styles.skillDetailsWrap);
        this.div.appendChild(this.details);

        this.game = game;
        this.createList();
        this.update();
        parent.appendChild(this.div);
    }

    showSkill(skill: Skill) {
        this.details.innerHTML = '';
        this.shownSkill = skill;

        const div = document.createElement('div');
        div.classList.add(styles.skillDetails);

        const h = document.createElement('h3');
        h.innerText = skill.name;
        div.append(h);

        const p = document.createElement('p');
        p.innerText = skill.description || '';
        div.append(p);

        if (skill instanceof ActiveSkill) {
            this.selectButton = document.createElement('button');
            this.selectButton.classList.add(styles.selectButton);
            this.update();
            div.append(this.selectButton);
        } else {
            this.selectButton = undefined;
        }

        this.details.appendChild(div);
    }

    private createSkillListElement(skill: Skill, active = false): HTMLElement {
        const that = this;

        const div = document.createElement('div');
        div.classList.add(styles.skill);

        const img = document.createElement('img');
        img.setAttribute('src', skill.icon);
        div.append(img);

        const h = document.createElement('h3');
        h.innerText = skill.name;
        div.append(h);

        const level = document.createElement('span');
        level.classList.add(styles.skillLevel);
        div.append(level);

        const xpBarWrap = document.createElement('div');
        xpBarWrap.classList.add(styles.xpBarWrap);
        div.append(xpBarWrap);

        const xpBar = document.createElement('div');
        xpBar.classList.add(styles.xpBar);
        xpBarWrap.append(xpBar);

        const xpCount = document.createElement('span');
        xpCount.classList.add(styles.xpCount);
        xpBarWrap.append(xpCount);

        div.onclick = () => {
            for (const d of this.list.children) {
                d.classList.remove(styles.active);
            }
            div.classList.add(styles.active);
            that.showSkill(skill);
        };

        if (active) {
            for (const d of this.list.children) {
                d.classList.remove(styles.active);
            }
            div.classList.add(styles.active);
        }
        this.listElement.set(skill.id, {
            div,
            level,
            xpBar,
            xpCount,
        });
        return div;
    }

    private createList() {
        this.list.innerHTML = '';
        this.listElement.clear();

        const skills = Array.from(this.game.world.skills.skills.values()).sort(
            (a: Skill, b: Skill) => (a.name > b.name ? 1 : -1)
        );
        for (const skill of skills) {
            const div = this.createSkillListElement(skill, skill === skills[0]);
            this.list.appendChild(div);
        }
        this.showSkill(skills[0]);
    }

    updateDetails() {
        const that = this;
        const selectButton = this.selectButton;
        const skill = this.shownSkill;
        if (!selectButton) {
            return;
        }
        if (!skill) {
            return;
        }

        if (that.game.player.skillLearned(skill.id)) {
            selectButton.innerText = 'Select';
            selectButton.removeAttribute('title');
            selectButton.classList.remove(styles.disabledButton);
            selectButton.onclick = () => {
                that.game.player.skillSelect(skill);
            };
        } else {
            selectButton.innerText = 'Learn';
            selectButton.onclick = () => {
                that.game.player.skillLearn(skill.id);
                that.update();
            };
            if (that.game.player.skillPoints <= 0) {
                selectButton.classList.add(styles.disabledButton);
                selectButton.setAttribute(
                    'title',
                    `You don't have enough skill points to learn this skill right now, you should get one with your next level up after slaying enough enemeis.`
                );
            } else {
                selectButton.classList.remove(styles.disabledButton);
                selectButton.removeAttribute('title');
            }
        }
    }

    update() {
        this.updateDetails();
        for (const [
            id,
            { div, level, xpBar, xpCount },
        ] of this.listElement.entries()) {
            const ps = this.game.player.skill.get(id);
            if (ps) {
                level.innerText = String(ps.level);
                if (ps.isMaxPower()) {
                    xpCount.innerText = `MAX POWER`;
                    xpBar.style.width = `100%`;
                } else {
                    const xpNeeded = ps.skill.xpPerLevel * (ps.level + 1);
                    xpCount.innerText = `${ps.xp} / ${xpNeeded}`;
                    const percent = ps.xp / xpNeeded;
                    xpBar.style.width = `${percent * 100}%`;
                }
                div.classList.remove(styles.unlearned);
            } else {
                level.innerText = '';
                xpCount.innerText = '';
                div.classList.add(styles.unlearned);
            }
        }
    }
}
