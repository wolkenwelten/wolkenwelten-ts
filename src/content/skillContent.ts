/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */

/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import axefightingUrl from '../../assets/gfx/skill/axefighting.png';
import clubmanshipUrl from '../../assets/gfx/skill/clubmanship.png';
import heavystrikeUrl from '../../assets/gfx/skill/heavyStrike.png';
import magickMissileUrl from '../../assets/gfx/skill/magickMissile.png';
import onehandedUrl from '../../assets/gfx/skill/onehanded.png';
import pickeneeringUrl from '../../assets/gfx/skill/pickeneering.png';
import pugilismUrl from '../../assets/gfx/skill/pugilism.png';
import throwingUrl from '../../assets/gfx/skill/throwing.png';
import wandwhippingUrl from '../../assets/gfx/skill/wandWhipping.png';

import type { Entity } from '../world/entity/entity';
import { Character } from '../world/entity/character';
import { Being } from '../world/entity/being';
import { Projectile } from '../world/entity/projectile';
import { Skill } from '../world/skill';

export const registerSkills = () => {
    Skill.registerPassive(
        'throwing',
        'Throwing',
        throwingUrl,
        `The technique of hurling objects at far away targets with both precision and power. Increases both range and rate of throwing.`,
        10
    );

    Skill.registerPassive(
        'pugilism',
        'Pugilism',
        pugilismUrl,
        `Now you can let your fists do the talking.`,
        30
    );

    Skill.registerPassive(
        'onehanded',
        'One-handed Weapons',
        onehandedUrl,
        `You have some more general understanding of how to fight with one handed weapons, like sticks, axes, swords, daggers and so on.`,
        50
    );

    Skill.registerPassive(
        'clubmanship',
        'Clubmanship',
        clubmanshipUrl,
        `The gentlemenly pursuit of swinging blunt objects around vigorously with the intention to cause physical trauma in others.`
    );

    Skill.registerPassive(
        'axefighting',
        'Axefighting',
        axefightingUrl,
        `You now know how to handle an axe, making it both a more effective tool and weapon in your hands.`
    );

    Skill.registerPassive(
        'pickeneering',
        'Pickeneering',
        pickeneeringUrl,
        `With this skill you now deal more damage to both monsters and minerals using pickaxes.`
    );

    Skill.registerPassive(
        'wandWhipping',
        'Wand whipping',
        wandwhippingUrl,
        `You are now an experienced wand user, which not only improves your physical prowess, but also unlocks some magical abilities.`
    );

    Skill.registerActive(
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
                    c.skillXpGain('heavyStrike', 1);
                    return true;
                } else {
                    c.world.game.audio.play('punchMiss');
                }
            }
            return false;
        }
    );

    Skill.registerActive(
        'magickMissile',
        'Magick missile',
        magickMissileUrl,
        `Throw small but deadly projectiles at whatever foe you are pointing at.`,
        20,
        (user, skillLevel) => {
            let hit = false;
            if (user instanceof Character) {
                if (user.isOnCooldown() || !user.useMana(1)) {
                    return false;
                }
                user.cooldown(30);
                user.hitAnimation = user.world.game.render.frames;
                user.world.game.audio.play('punchMiss');

                const count = 1;
                for (let i = 0; i < count; i++) {
                    setTimeout(() => {
                        const proj = new Projectile(user, 1.2);
                        proj.ttl = 48;
                        const vx = proj.vx;
                        const vy = proj.vy;
                        const vz = proj.vz;
                        proj.x += vx;
                        proj.y += vy;
                        proj.z += vz;
                        const off = Math.floor(Math.random() * 1000);

                        proj.onHit = function (this: Projectile, e: Entity) {
                            if (!hit) {
                                hit = true;
                                user.skillXpGain('magickMissile', 1);
                            }
                            if (e instanceof Being) {
                                user.doDamage(e, 1);
                            }
                            this.world.game.render.particle.fxStrike(
                                e.x,
                                e.y,
                                e.z
                            );
                        };
                        proj.onMiss = function (this: Projectile) {
                            this.world.game.render.particle.fxStrike(
                                this.x,
                                this.y,
                                this.z
                            );
                            this.destroy();
                        };
                        proj.onUpdate = function (this: Projectile) {
                            this.vx =
                                vx +
                                (Math.cos((this.ttl + 5 + off + i * 23) * 0.5) -
                                    0.5) *
                                    0.02;
                            this.vy =
                                vy +
                                (Math.cos(
                                    (this.ttl + 10 + off + i * 42) * 0.7
                                ) -
                                    0.5) *
                                    0.02;
                            this.vz =
                                vz +
                                (Math.cos(
                                    (this.ttl + 15 + off + i * 69) * 0.11
                                ) -
                                    0.5) *
                                    0.02;
                            this.world.game.render.particle.add(
                                this.x,
                                this.y,
                                this.z,
                                192,
                                0xafa010df,
                                0,
                                0,
                                0,
                                -10,
                                0,
                                0,
                                0,
                                0
                            );
                            const vxs = (this.vx * 1) / 9;
                            const vys = (this.vy * 1) / 9;
                            const vzs = (this.vz * 1) / 9;
                            for (let i = 0; i < 9; i++) {
                                this.world.game.render.particle.add(
                                    this.x + vxs * i,
                                    this.y + vys * i,
                                    this.z + vzs * i,
                                    56,
                                    0x1f8030af,
                                    0,
                                    0,
                                    0,
                                    -0.9,
                                    0,
                                    0,
                                    0,
                                    0
                                );
                            }
                        };
                    }, (i + 1) * (i + 1) * 24);
                }
            }
            return false;
        }
    );
};
