/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { SkillSystem } from './skill';
import throwingUrl from '../../../assets/gfx/skill/throwing.png';
import pugilismUrl from '../../../assets/gfx/skill/pugilism.png';
import onehandedUrl from '../../../assets/gfx/skill/onehanded.png';
import clubmanshipUrl from '../../../assets/gfx/skill/clubmanship.png';
import axefightingUrl from '../../../assets/gfx/skill/axefighting.png';
import pickeneeringUrl from '../../../assets/gfx/skill/pickeneering.png';
import heavystrikeUrl from '../../../assets/gfx/skill/heavyStrike.png';
import { Character } from '../character';
import { Being } from '../entity/being';
import { Entity } from '../entity/entity';

export const addDefaultSkills = (skills: SkillSystem) => {
    skills.addPassive(
        'throwing',
        'Throwing',
        throwingUrl,
        `The technique of hurling objects at far away targets with both precision and power. Increases both range and rate of throwing.`,
        10
    );

    skills.addPassive(
        'pugilism',
        'Pugilism',
        pugilismUrl,
        `Now you can let your fists do the talking.`,
        30
    );

    skills.addPassive(
        'onehanded',
        'One-handed Weapons',
        onehandedUrl,
        `You have some more general understanding of how to fight with one handed weapons, like sticks, axes, swords, daggers and so on.`,
        50
    );

    skills.addPassive(
        'clubmanship',
        'Clubmanship',
        clubmanshipUrl,
        `The gentlemenly pursuit of swinging blunt objects around vigorously with the intention to cause physical trauma in others.`
    );

    skills.addPassive(
        'axefighting',
        'Axefighting',
        axefightingUrl,
        `You now know how to handle an axe, making it both a more effective tool and weapon in your hands.`
    );

    skills.addPassive(
        'pickeneering',
        'Pickeneering',
        pickeneeringUrl,
        `With this skill you now deal more damage to both monsters and minerals using pickaxes.`
    );

    skills.addActive(
        'heavyStrike',
        'Heavy Strike',
        heavystrikeUrl,
        `Unleash a heavy blow, greatly increasing damage dealt as well as knockback!`,
        20,
        (c, skillLevel) => {
            if (c instanceof Character) {
                const weapon = c.equipmentWeapon();
                const mul = 1 + skillLevel * 0.5;
                const dmg = (weapon?.attackDamage(c) || 0) * mul;
                if (c.isOnCooldown() || !dmg || !c.useMana(4)) {
                    return false;
                }
                c.hitAnimation = c.world.game.render.frames;
                c.cooldown(120);
                const hit = c.attack(1.8, (e: Entity) => {
                    const dx = e.x - c.x;
                    const dz = e.z - c.z;
                    const dm = Math.max(Math.abs(dx), Math.abs(dz));
                    const ndx = dx / dm;
                    const ndz = dz / dm;
                    e.vx += ndx * 0.12;
                    e.vy += 0.06;
                    e.vz += ndz * 0.12;
                    if (e instanceof Being) {
                        c.doDamage(e, dmg);
                    }
                    c.world.game.render.particle.fxStrike(e.x, e.y, e.z);
                    c.world.game.render.particle.fxStrike(e.x, e.y, e.z);
                });
                c.world.game.audio.play('heavyStrike');
                if (hit) {
                    c.world.game.audio.play('punch');
                    return true;
                } else {
                    c.world.game.audio.play('punchMiss');
                }
            }
            return false;
        }
    );
};
