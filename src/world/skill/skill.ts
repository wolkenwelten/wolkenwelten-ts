/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Character } from '../entity/character';
import { World } from '../world';
import { addDefaultSkills } from './skillDefaults';

export class CharacterSkill {
    char: Character;
    skill: Skill;

    xp = 0;
    xpTotal = 0;
    level = 0;

    private checkLevelUp() {
        if (this.level === this.skill.maxLevel) {
            return;
        }

        if (this.xp >= this.skill.xpPerLevel * (this.level + 1)) {
            this.xp -= this.skill.xpPerLevel * (this.level + 1);
            this.level++;
            this.char.world.game.ui.log.addEntry(
                `Your skill in ${this.skill.name} has reached ${this.level}`
            );
            this.checkLevelUp();
        }
    }

    constructor(char: Character, skill: Skill) {
        this.char = char;
        this.skill = skill;
    }

    use() {}

    xpGain(amount = 1) {
        this.xp += amount;
        this.xpTotal += amount;
        this.checkLevelUp();
    }

    isMaxPower(): boolean {
        return this.level === this.skill.maxLevel;
    }
}

export class Skill {
    readonly id: string;

    readonly name: string;
    readonly icon: string;
    readonly description: string;

    readonly xpPerLevel: number;
    readonly maxLevel = 4;

    constructor(
        id: string,
        name: string,
        icon: string,
        description: string,
        xpPerLevel: number
    ) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.description = description;
        this.xpPerLevel = xpPerLevel;
    }
}

export class SkillSystem {
    world: World;
    skills: Map<string, Skill> = new Map();

    addPassive(
        id: string,
        name: string,
        icon: string,
        description: string,
        xpPerLevel = 10
    ) {
        this.skills.set(id, new Skill(id, name, icon, description, xpPerLevel));
    }

    get(id: string): Skill | undefined {
        return this.skills.get(id);
    }

    constructor(world: World) {
        this.world = world;
        addDefaultSkills(this);
    }
}
