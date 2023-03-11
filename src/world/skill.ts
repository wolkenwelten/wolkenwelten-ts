/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Character } from './entity/character';
import type { Entity } from './entity/entity';

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
            this.char.world.game.ui?.log.addEntry(
                `Your skill in ${this.skill.name} has reached level ${this.level}`
            );
            this.checkLevelUp();
        }
    }

    constructor(char: Character, skill: Skill) {
        this.char = char;
        this.skill = skill;
    }

    use() {
        const used = this.skill.use(this.char, this.level);
        if (used) {
            this.xpGain(1);
        }
    }

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
    readonly maxLevel: number;

    static registry: Map<string, Skill> = new Map();

    static registerPassive(
        id: string,
        name: string,
        icon: string,
        description: string,
        xpPerLevel = 10
    ) {
        this.registry.set(
            id,
            new Skill(id, name, icon, description, xpPerLevel)
        );
    }

    static registerActive(
        id: string,
        name: string,
        icon: string,
        description: string,
        xpPerLevel: number,
        useCB: (e: Entity, skillLevel: number) => boolean
    ) {
        this.registry.set(
            id,
            new ActiveSkill(id, name, icon, description, xpPerLevel, useCB)
        );
    }

    static get(id: string): Skill | undefined {
        return this.registry.get(id);
    }

    constructor(
        id: string,
        name: string,
        icon: string,
        description: string,
        xpPerLevel: number,
        maxLevel = 4
    ) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.description = description;
        this.xpPerLevel = xpPerLevel;
        this.maxLevel = maxLevel;
    }

    use(e: Entity, skillLevel: number): boolean {
        return false;
    }
}

export class ActiveSkill extends Skill {
    readonly maxLevel = 1;
    readonly useCB: (e: Entity, skillLevel: number) => boolean;

    constructor(
        id: string,
        name: string,
        icon: string,
        description: string,
        xpPerLevel: number,
        useCB: (e: Entity, skillLevel: number) => boolean
    ) {
        super(id, name, icon, description, xpPerLevel);
        this.useCB = useCB;
    }

    use(e: Entity, skillLevel: number): boolean {
        return this.useCB(e, skillLevel);
    }
}
