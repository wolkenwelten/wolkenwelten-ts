/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { SkillSystem } from './skill';

export const addDefaultSkills = (skills: SkillSystem) => {
    skills.addPassive(
        'throwing',
        'Throwing',
        '',
        `The technique of hurling objects at far away targets with both precision and power. Increases both range and rate of throwing.`,
        10
    );

    skills.addPassive(
        'pugilism',
        'Pugilism',
        '',
        `Now you can let your fists do the talking.`,
        30
    );

    skills.addPassive(
        'onehanded',
        'One-handed Weapons',
        '',
        `You have some more general understanding of how to fight with one handed weapons, like sticks, axes, swords, daggers and so on.`,
        50
    );

    skills.addPassive(
        'clubmanship',
        'Clubmanship',
        '',
        `The gentlemenly pursuit of swinging blunt objects around vigorously with the intention to cause physical trauma in others.`
    );

    skills.addPassive(
        'axefighting',
        'Axefighting',
        '',
        `You now know how to handle an axe, making it both a more effective tool and weapon in your hands.`
    );

    skills.addPassive(
        'pickeneering',
        'Pickeneering',
        '',
        `With this skill you now deal more damage to both monsters and minerals using pickaxes.`
    );
};
