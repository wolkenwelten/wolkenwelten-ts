/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Entity } from './entity';
import { Inventory } from '../item/inventory';
import { World } from '../world';
import { mat4 } from 'gl-matrix';
import { BlockItem } from '../item/blockItem';
import { TriangleMesh, VoxelMesh } from '../../render/asset';
import { CrabMeatRaw } from '../item/food/crabMeatRaw';
import { ItemDrop } from './itemDrop';
import { StoneAxe } from '../item/tools/stoneAxe';
import { StonePickaxe } from '../item/tools/stonePickaxe';
import { Stick } from '../item/material/stick';
import { MaybeItem } from '../item/item';
import { IronPickaxe } from '../item/tools/ironPickaxe';
import { IronAxe } from '../item/tools/ironAxe';
import { Stone } from '../item/material/stone';
import { CharacterSkill, Skill } from '../skill/skill';

const CHARACTER_ACCELERATION = 0.05;
const CHARACTER_STOP_RATE = CHARACTER_ACCELERATION * 3.0;

const clamp = (x: number, min: number, max: number) =>
    Math.min(Math.max(x, min), max);

export class Character extends Entity {
    spawnX: number;
    spawnY: number;
    spawnZ: number;
    spawnYaw: number;
    spawnPitch: number;

    movementX = 0;
    movementY = 0;
    movementZ = 0;
    lastAction = 0;
    miningCooldownUntil = 0;
    hitAnimation = -100;
    walkCycleCounter = 0;
    nextStepSound = 0;

    jumpAnimeFactor = 0;
    inertiaX = 0;
    inertiaZ = 0;

    miningX = 0;
    miningY = 0;
    miningZ = 0;
    miningActive = false;

    health = 12;
    maxHealth = 12;
    isDead = false;

    mana = 12;
    maxMana = 12;
    nextManaRegen = 0;

    level = 0;
    xp = 0;
    weight = 70;

    inventory: Inventory;
    skill: Map<string, CharacterSkill> = new Map();
    selectedSkill?: CharacterSkill;

    getGoodStuff() {
        this.inventory.add(new IronAxe(this.world));
        this.inventory.add(new IronPickaxe(this.world));
        this.inventory.add(new StoneAxe(this.world));
        this.inventory.add(new StonePickaxe(this.world));
        this.inventory.add(new CrabMeatRaw(this.world, 3));
        this.inventory.add(new Stick(this.world, 3));
        this.inventory.add(new Stone(this.world, 90));
        this.inventory.add(new BlockItem(this.world, 3, 90));

        this.skillXpGain('axefighting', 295);
        this.skillXpGain('pugilism', 100);
        this.skillXpGain('throwing', 100);
    }

    init() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.z = this.spawnZ;
        this.xp = this.level = 0;
        this.yaw = this.spawnYaw;
        this.pitch = this.spawnPitch;
        this.noClip = false;
        this.isDead = false;
        this.selectedSkill = undefined;
        this.maxHealth = this.health = 12;
        this.maxMana = this.mana = 12;
        this.hitAnimation = -100;
        this.lastAction = 0;
        this.miningActive = false;
        this.miningX = this.miningY = this.miningZ = 0;
        this.vx = this.vy = this.vz = 0;
        this.inventory.clear();
        this.skill.clear();

        this.inventory.select(0);
        this.skillXpGain('heavyStrike', 0);
        this.selectedSkill = this.skill.get('heavyStrike');
    }

    constructor(
        world: World,
        x: number,
        y: number,
        z: number,
        yaw: number,
        pitch: number,
        noClip = false
    ) {
        super(world);
        this.spawnX = this.x = x;
        this.spawnY = this.y = y;
        this.spawnZ = this.z = z;
        this.spawnYaw = yaw;
        this.spawnPitch = pitch;
        this.inventory = new Inventory(40);
        this.init();
        this.noClip = noClip;
    }

    damage(rawAmount: number) {
        this.health = Math.min(
            this.maxHealth,
            Math.max(0, this.health - rawAmount)
        );
        if (this.health <= 0) {
            if (!this.isDead) {
                this.isDead = true;
                this.onDeath();
            }
        }
    }

    heal(rawAmount: number) {
        this.damage(-rawAmount);
    }

    useMana(amount: number): boolean {
        if (this.mana > amount) {
            this.mana -= amount;
            return true;
        } else {
            return false;
        }
    }

    /* Walk/Run according to the direction of the Entity, ignores pitch */
    move(ox: number, oy: number, oz: number) {
        this.inertiaX = this.inertiaX * 0.97 + ox * -0.03;
        this.inertiaZ = this.inertiaZ * 0.97 + oz * -0.03;

        if (ox === 0 && oz === 0) {
            this.movementX = this.movementZ = 0;
        } else {
            if (oz > 0) {
                oz *= 0.5;
            }
            this.movementX =
                ox * 0.75 * Math.cos(-this.yaw) + oz * Math.sin(this.yaw);
            this.movementZ =
                ox * 0.75 * Math.sin(-this.yaw) + oz * Math.cos(this.yaw);
        }

        if (oy > 0) {
            this.movementY = 1;
        } else {
            this.movementY = 0;
        }
    }

    fly(ox: number, oy: number, oz: number) {
        const [nox, noy, noz] = this.direction(ox, oy, oz);
        this.movementX = nox;
        this.movementY = noy;
        this.movementZ = noz;
    }

    rotate(yaw: number, pitch: number) {
        this.yaw = (this.yaw + yaw) % (Math.PI * 2);
        this.pitch = clamp(this.pitch + pitch, -Math.PI / 2, Math.PI / 2);
    }

    isUnderwater(): boolean {
        return this.world.isLiquid(this.x, this.y, this.z);
    }

    mayJump(): boolean {
        return this.world.isSolid(this.x, this.y - 1.7, this.z);
    }

    maySwim(): boolean {
        return this.world.isLiquid(this.x, this.y - 0.25, this.z);
    }

    collides() {
        return (
            Boolean(this.world.getBlock(this.x, this.y + 1, this.z)) ||
            Boolean(this.world.getBlock(this.x, this.y, this.z)) ||
            Boolean(this.world.getBlock(this.x, this.y - 1, this.z))
        );
    }

    isSolidPillar(x: number, y: number, z: number): boolean {
        return (
            this.world.isSolid(x, y, z) ||
            this.world.isSolid(x, y - 0.4, z) ||
            this.world.isSolid(x, y + 0.8, z)
        );
    }

    updateMana() {
        if (this.world.game.ticks > this.nextManaRegen) {
            this.nextManaRegen = this.world.game.ticks + 100;
            this.mana++;
        }
        this.mana = Math.max(0, Math.min(this.maxMana, this.mana));
    }

    update() {
        if (this.isDead) {
            return;
        }
        this.updateMana();

        if (this.noClip) {
            this.vx = this.vy = this.vz = 0;
            this.x += this.movementX;
            this.y += this.movementY;
            this.z += this.movementZ;
            return;
        }

        if (!this.world.isLoaded(this.x, this.y, this.z)) {
            return; // Just freeze the character until we have loaded the area, this shouldn't happen if at all possible
        }
        const underwater = this.isUnderwater();

        const movementLength = Math.sqrt(
            this.movementX * this.movementX + this.movementZ * this.movementZ
        );
        this.walkCycleCounter += Math.min(0.2, movementLength);
        if (this.walkCycleCounter > this.nextStepSound && this.mayJump()) {
            this.nextStepSound = this.walkCycleCounter + 6;
            this.world.game.audio.play('step', 0.5);
        }
        let speed = 0.3;
        let accel =
            movementLength > 0.01
                ? CHARACTER_ACCELERATION
                : CHARACTER_STOP_RATE;

        if (!this.mayJump()) {
            speed *= 0.5; // Slow down player movement changes during jumps
        }
        if (underwater) {
            speed *= 0.5; // Slow down player movement while underwater
        }
        if (this.lastAction > this.world.game.ticks) {
            speed *= 0.5;
        }

        this.vx = this.vx * (1.0 - accel) + this.movementX * speed * accel;
        this.vz = this.vz * (1.0 - accel) + this.movementZ * speed * accel;
        this.vy -= underwater ? 0.001 : 0.005;
        const oldVx = this.vx;
        const oldVy = this.vy;
        const oldVz = this.vz;

        this.jumpAnimeFactor = Math.max(0, this.jumpAnimeFactor * 0.97);

        if (underwater) {
            this.vy *= 0.98;
            this.vx *= 0.99;
            this.vz *= 0.99;
        } else if (this.movementY > 0 && this.mayJump()) {
            this.vy = 0.12;
            this.jumpAnimeFactor = 1;
        }
        if (this.movementY > 0 && this.maySwim() && Math.abs(this.vy) < 0.07) {
            this.vy = 0.06;
            this.jumpAnimeFactor = 0.5;
        }

        if (this.isSolidPillar(this.x - 0.4, this.y - 0.8, this.z)) {
            this.vx = Math.max(this.vx, 0);
        }
        if (this.isSolidPillar(this.x + 0.4, this.y - 0.8, this.z)) {
            this.vx = Math.min(this.vx, 0);
        }

        if (this.world.isSolid(this.x, this.y - 1.7, this.z)) {
            this.vy = Math.max(this.vy, 0);
        }
        if (this.world.isSolid(this.x, this.y + 0.7, this.z)) {
            this.vy = Math.min(this.vy, 0);
        }

        if (this.isSolidPillar(this.x, this.y - 0.8, this.z - 0.4)) {
            this.vz = Math.max(this.vz, 0);
        }
        if (this.isSolidPillar(this.x, this.y - 0.8, this.z + 0.4)) {
            this.vz = Math.min(this.vz, 0);
        }

        const dx = this.vx - oldVx;
        const dy = this.vy - oldVy;
        const dz = this.vz - oldVz;
        const force = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (force > 0.2) {
            this.world.game.audio.play('stomp', 0.5);
        }
        if (force > 0.1) {
            const amount = Math.floor(force * 2);
            if (amount > 0) {
                this.damage(amount * amount);
            }
        }

        const len = this.vx * this.vx + this.vz * this.vz + this.vy * this.vy;
        if (len > 2.0) {
            const v = clamp(1.0 - (len - 0.2), 0.0001, 1.0);
            this.vx *= v;
            this.vy *= v;
            this.vz *= v;
        }
        this.beRepelledByEntities();

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
    }

    cooldown(ticks: number) {
        this.lastAction = this.world.game.ticks + ticks;
    }

    dig() {
        const ray = this.raycast();
        if (!ray) {
            return;
        }
        const [x, y, z] = ray;
        const minedBlock = this.world.getBlock(x, y, z) || 0;
        if (minedBlock === 0) {
            return;
        }
        const dmg = this.inventory.active()?.miningDamage(minedBlock) || 0;
        if (dmg > 0) {
            this.miningActive = true;
            this.miningX = x;
            this.miningY = y;
            this.miningZ = z;
        }
    }

    doDamage(target: Entity, damage: number) {
        const wasDead = target.isDead;
        target.damage(damage);
        target.onAttack(this);
        if (!wasDead) {
            if (target.isDead) {
                const xp = Math.max(0, target.level - this.level);
                this.xpGain(xp);
            }
        }
    }

    attack(radius = 1.6, damageCB?: (e: Entity) => void): boolean {
        const [vx, vy, vz] = this.direction(0, 0, radius * -0.6);
        const x = this.x + vx;
        const y = this.y + vy;
        const z = this.z + vz;
        let hit = false;
        const rr = radius * radius;
        const weapon = this.inventory.active();
        for (const e of this.world.entities) {
            if (e === this || e instanceof ItemDrop) {
                continue;
            }
            const dx = e.x - x;
            const dy = e.y - y;
            const dz = e.z - z;
            const dd = dx * dx + dy * dy + dz * dz;
            if (dd < rr) {
                hit = true;
                if (damageCB) {
                    damageCB(e);
                } else {
                    const dm = Math.max(Math.abs(dx), Math.abs(dz));
                    const ndx = dx / dm;
                    const ndz = dz / dm;
                    e.vx += ndx * 0.03;
                    e.vy += 0.02;
                    e.vz += ndz * 0.03;
                    this.doDamage(e, weapon?.attackDamage(e) || 1);
                    this.world.game.render.particle.fxStrike(e.x, e.y, e.z);
                }
            }
        }

        const srr = (radius + 0.4) * (radius + 0.4);
        for (let cxo = -1; cxo < 2; cxo++) {
            for (let cyo = -1; cyo < 2; cyo++) {
                for (let czo = -1; czo < 2; czo++) {
                    const cx = x + cxo * 32;
                    const cy = y + cyo * 32;
                    const cz = z + czo * 32;
                    const c = this.world.getChunk(cx, cy, cz);
                    if (!c) {
                        continue;
                    }
                    for (const s of c.static) {
                        const dx = x - s.x;
                        const dy = y - s.y;
                        const dz = z - s.z;
                        const dd = dx * dx + dy * dy + dz * dz;
                        if (dd < srr) {
                            s.onAttacked(this);
                        }
                    }
                }
            }
        }

        return hit;
    }

    onDeath() {
        this.world.game.audio.play('ungh', 0.2);
        this.init();
    }

    onAttack(perpetrator: Entity): void {
        this.world.game.render.canvasWrapper.classList.remove('fx-damage');
        this.world.game.render.canvasWrapper.getBoundingClientRect();
        this.world.game.render.canvasWrapper.classList.add('fx-damage');
        this.miningCooldownUntil = this.world.game.ticks + 10;
        this.world.game.audio.play('ungh', 0.2);
    }

    isOnCooldown(): boolean {
        return this.world.game.ticks < this.lastAction;
    }

    strike() {
        if (this.world.game.ticks < this.lastAction) {
            if (this.miningCooldownUntil < this.world.game.ticks) {
                this.dig();
            }
            return;
        }
        const item = this.inventory.active();

        this.hitAnimation = this.world.game.render.frames;
        const hit = this.attack();
        const cooldownDur = item
            ? item.attackCooldown(this)
            : 80 - this.skillLevel('pugilism') * 12;
        this.cooldown(cooldownDur);
        if (hit) {
            this.world.game.audio.play('punch');
            this.miningCooldownUntil = this.world.game.ticks + cooldownDur;

            if (item) {
                item.onAttackWith(this);
            } else {
                this.skillXpGain('pugilism', 1);
            }
        } else {
            this.world.game.audio.play('punchMiss');
        }
        if (this.miningActive) {
            const minedBlock =
                this.world.getBlock(this.miningX, this.miningY, this.miningZ) ||
                0;
            this.world.blocks[minedBlock].playMineSound(this.world);
        }
    }

    primaryAction() {
        const item = this.inventory.active();
        if (item) {
            item.use(this);
        } else {
            this.strike();
        }
    }

    secondaryAction() {
        this.selectedSkill?.use();
    }

    dropActiveItem() {
        if (this.world.game.ticks < this.lastAction) {
            return;
        }
        const item = this.inventory.active();
        if (!item) {
            return;
        }
        if (item.drop(this)) {
            this.hitAnimation = this.world.game.render.frames;
            this.inventory.items[this.inventory.selection] = undefined;
            this.inventory.updateAll();
        }
    }

    dropItem(item: MaybeItem) {
        if (!item) {
            return;
        }
        if (item.dropAll(this)) {
            this.hitAnimation = this.world.game.render.frames;
            this.inventory.updateAll();
        }
    }

    draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
        return;
    }

    hudMesh(): VoxelMesh | TriangleMesh {
        const heldItem = this.inventory.active();
        if (!heldItem) {
            return this.world.game.render.assets.fist;
        } else {
            return heldItem.mesh(this.world);
        }
    }

    xpForLevel(level: number): number {
        return level * 16;
    }

    xpPercentageTillNextLevel(): number {
        const base = this.xpForLevel(this.level);
        const goal = this.xpForLevel(this.level + 1);
        const relGoal = goal - base;
        const relBase = this.xp - base;
        const p = relBase / relGoal;
        return p;
    }

    xpCheckLevelUp() {
        if (this.xpPercentageTillNextLevel() >= 1) {
            this.level++;
            this.maxHealth += 4;
            this.health = this.maxHealth;
            this.world.game.audio.play('levelUp', 0.5);
            this.world.game.ui.log.addEntry(
                `You've reached level ${
                    this.level + 1
                }! Maximum health increased.`
            );
        }
    }

    xpGain(amount: number) {
        this.xp += amount;
        this.xpCheckLevelUp();
    }

    skillXpGain(skillId: string, amount: number) {
        if (skillId === '') {
            return;
        }
        const ps = this.skill.get(skillId);
        if (ps) {
            ps.xpGain(amount);
        } else {
            const skill = this.world.skills.get(skillId);
            if (!skill) {
                throw new Error(`Unknown skill: ${skillId}`);
            }
            const nps = new CharacterSkill(this, skill);
            this.skill.set(skillId, nps);
            nps.xpGain(amount);
        }
    }

    skillLevel(skillId: string): number {
        return this.skill.get(skillId)?.level || 0;
    }

    selectSkill(skill?: Skill) {
        if (skill) {
            for (const cs of this.skill.values()) {
                if (cs.skill === skill) {
                    this.selectedSkill = cs;
                    return;
                }
            }
        }
        this.selectedSkill = undefined;
    }
}
