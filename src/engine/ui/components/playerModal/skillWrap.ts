/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Game } from '../../../game';
import { Item } from '../../../world/item/item';
import { ActiveSkill, Skill } from '../../../world/skill';
import { Div, H3, Img, P, Span } from '../../utils';
import styles from './skillWrap.module.css';

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
        this.game = game;
        this.div = Div({
            class: styles.skilWrap,
            children: [
                (this.list = Div({ class: styles.skillList })),
                (this.details = Div({ class: styles.skillDetailsWrap })),
            ],
        });
        this.createList();
        this.update();
        parent.appendChild(this.div);
    }

    showSkill(skill: Skill) {
        this.details.innerHTML = '';
        this.shownSkill = skill;

        const div = Div({
            class: styles.skillDetails,
            children: [
                H3({ text: skill.name }),
                P({ text: skill.description || '' }),
            ],
        });

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
        const div = Div({
            class: styles.skill,
            children: [Img({ src: skill.icon }), H3({ text: skill.name })],
        });

        const level = Span({ class: styles.skillLevel });
        div.append(level);

        const xpBarWrap = Div({ class: styles.xpBarWrap });
        div.append(xpBarWrap);

        const xpBar = Div({ class: styles.xpBar });
        xpBarWrap.append(xpBar);

        const xpCount = Span({ class: styles.xpCount });
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

        const skills = Array.from(Skill.registry.values()).sort(
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

        if (that.game.player.skillIsLearned(skill.id)) {
            selectButton.innerText = 'Grab';
            selectButton.removeAttribute('title');
            selectButton.classList.remove(styles.disabledButton);
            selectButton.onclick = () => {
                if (that.game.ui.heldItem instanceof Item) {
                    if (
                        !that.game.player.inventory.add(that.game.ui.heldItem)
                    ) {
                        that.game.player.dropItem(that.game.ui.heldItem);
                    }
                }
                if (skill instanceof ActiveSkill) {
                    that.game.ui.heldItem = skill;
                    that.game.ui.cursorItem.update(that.game.ui.heldItem);
                }
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
