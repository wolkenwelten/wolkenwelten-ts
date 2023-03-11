/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4 } from 'gl-matrix';

import type { TriangleMesh } from '../../render/meshes/triangleMesh/triangleMesh';
import type { VoxelMesh } from '../../render/meshes/voxelMesh/voxelMesh';
import type { Entity } from './entity';
import type { World } from '../world';
import { Being } from './being';
import { ItemDrop } from './itemDrop';
import { Inventory } from '../item/inventory';
import { Item, MaybeItem } from '../item/item';
import { ActiveSkill, CharacterSkill, Skill } from '../skill';

const CHARACTER_ACCELERATION = 0.05;
const CHARACTER_STOP_RATE = CHARACTER_ACCELERATION * 3.0;

const clamp = (x: number, min: number, max: number) =>
    Math.min(Math.max(x, min), max);

export class Character extends Being {
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
    skillPoints = 0;

    weight = 70;

    equipment: Inventory;
    inventory: Inventory;
    skill: Map<string, CharacterSkill> = new Map();

    /* Simple cheat, can be run from the browser console by typing `wolkenwelten.player.getGoodStuff();` */
    getGoodStuff() {
        this.inventory.add(Item.create('ironAxe', this.world));
        this.inventory.add(Item.create('ironPickaxe', this.world));
        this.inventory.add(Item.create('stoneAxe', this.world));
        this.inventory.add(Item.create('stonePickaxe', this.world));
        this.inventory.add(Item.create('crabMeatRaw', this.world, 3));
        this.inventory.add(Item.create('stick', this.world, 3));
        this.inventory.add(Item.create('stone', this.world, 90));

        this.equipment.items[0] = Item.create('club', this.world);
        this.equipment.items[1] = Item.create('woodShield', this.world);

        this.skillXpGain('axefighting', 295);
        this.skillXpGain('pugilism', 100);
        this.skillXpGain('throwing', 100);
        this.skillXpGain('magickMissile', 0);
        this.skillXpGain('heavyStrike', 0);
    }

    /* Initialize an already existing Character, that way we can easily reuse the same object, */
    init() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.z = this.spawnZ;
        this.xp = this.level = 0;
        this.yaw = this.spawnYaw;
        this.pitch = this.spawnPitch;
        this.noClip = false;
        this.isDead = false;
        this.maxHealth = this.health = 12;
        this.maxMana = this.mana = 12;
        this.hitAnimation = -100;
        this.lastAction = 0;
        this.miningActive = false;
        this.miningX = this.miningY = this.miningZ = 0;
        this.vx = this.vy = this.vz = 0;

        this.skill.clear();
        this.inventory.clear();
        this.equipment.clear();
        this.inventory.select(0);
        if (this.world.game.options.startWithEquipment) {
            setTimeout(() => {
                this.getGoodStuff();
            });
        }
    }

    constructor(
        world: World,
        x: number,
        y: number,
        z: number,
        yaw: number,
        pitch: number
    ) {
        super(world, x, y, z);
        this.inventory = new Inventory(40);
        this.equipment = new Inventory(10);
        this.equipment.mayPut = (index: number, item: Item): boolean => {
            switch (index) {
                case 0:
                    return item.isWeapon;
                case 1:
                    return item.isShield;
                case 2:
                    return item.isHeadwear;
                case 3:
                    return item.isTorsowear;
                case 4:
                    return item.isLegwear;
                case 5:
                    return item.isFootwear;
                default:
                    return false;
            }
        };
        this.init();
        this.spawnX = this.x = x;
        this.spawnY = this.y = y;
        this.spawnZ = this.z = z;
        this.spawnYaw = this.yaw = yaw;
        this.spawnPitch = this.pitch = pitch;
    }

    /* Damage a character by a certain value, will change in the future to take a Damage argument instead */
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

    /* Heal a character by a certain amount of hit points */
    heal(rawAmount: number) {
        this.damage(-rawAmount);
    }

    /* Try and use a certain amount of mana, returns true when the player had sufficient mana. */
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
                oz *= 0.5; // Slow down backwards movement
            }
            ox *= 0.75; // Slow down strafing somewhat
            this.movementX = ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw);
            this.movementZ = ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw);
        }
        this.movementY = oy > 0 ? 1 : 0;
    }

    /* Fly a player in a certain direction */
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
        while (this.world.game.ticks > this.nextManaRegen) {
            this.nextManaRegen += 5;
            this.mana += 0.05;
        }
        this.mana = Math.max(0, Math.min(this.maxMana, this.mana));
    }

    camOffY() {
        return Math.sin(this.walkCycleCounter) * 0.08;
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
        const dmg = this.equipmentWeapon()?.miningDamage(minedBlock) || 0;
        if (dmg > 0) {
            this.miningActive = true;
            this.miningX = x;
            this.miningY = y;
            this.miningZ = z;
        }
    }

    doDamage(target: Being, damage: number) {
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
        const weapon = this.equipmentWeapon();
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
                    if (e instanceof Being) {
                        this.doDamage(e, weapon?.attackDamage(e) || 1);
                    }
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

    /* Callback function that gets called when this Character dies */
    onDeath() {
        this.world.game.audio.play('ungh', 0.2);
        this.world.game.ui.hotbar.clear();
        this.init();
    }

    /* Callback function that gets called whenever this character is attacked */
    onAttack(perpetrator: Entity): void {
        this.world.game.render.canvasWrapper.classList.remove('fx-damage');
        this.world.game.render.canvasWrapper.getBoundingClientRect();
        this.world.game.render.canvasWrapper.classList.add('fx-damage');
        this.miningCooldownUntil = this.world.game.ticks + 10;
        this.world.game.audio.play('ungh', 0.2);
    }

    /* Return true when the character shouldn't be able to do anything */
    isOnCooldown(): boolean {
        return this.world.game.ticks < this.lastAction;
    }

    /* Do a melee attack using whatever item is currently selected */
    strike() {
        if (this.world.game.ticks < this.lastAction) {
            if (this.miningCooldownUntil < this.world.game.ticks) {
                this.dig();
            }
            return;
        }
        const item = this.equipmentWeapon();

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

    equipmentWeapon() {
        return this.equipment.items[0];
    }

    equipmentShield() {
        return this.equipment.items[1];
    }

    equipmentHead() {
        return this.equipment.items[2];
    }

    equipmentTorso() {
        return this.equipment.items[3];
    }

    equipmentLegs() {
        return this.equipment.items[4];
    }

    equipmentFeet() {
        return this.equipment.items[5];
    }

    /* Use the current item or punch if we don't have anything equipped */
    primaryAction() {
        const item = this.equipmentWeapon();
        if (item) {
            item.use(this);
        } else {
            this.strike();
        }
    }

    /* Use whatever skill is currently selected */
    secondaryAction() {}

    /* Drop the item in the argument in front of the player */
    dropItem(item: MaybeItem): ItemDrop | null {
        if (item) {
            const drop = ItemDrop.fromItem(item, this);
            this.hitAnimation = this.world.game.render.frames;
            this.inventory.updateAll();
            return drop;
        }
        return null;
    }

    /* Since right now WW is only singleplayer we can ignore this method */
    draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
        return;
    }

    /* Return the mesh of whatever we are currently holding, or a hand */
    hudMesh(): VoxelMesh | TriangleMesh {
        const heldItem = this.equipmentWeapon();
        if (!heldItem) {
            return this.world.game.render.assets.fist;
        } else {
            return heldItem.mesh();
        }
    }

    /* Return the absolute amount of XP needed to reach a certain level */
    xpForLevel(level: number): number {
        return level * 16;
    }

    /* Return how close we are to reaching the next level in the range 0.0 - 1.0 */
    xpPercentageTillNextLevel(): number {
        const base = this.xpForLevel(this.level);
        const goal = this.xpForLevel(this.level + 1);
        const relGoal = goal - base;
        const relBase = this.xp - base;
        const p = relBase / relGoal;
        return p;
    }

    /* Level up if we have enough XP, increasing skillpoints/maxHealth and so on */
    xpLevelUpIfAvailable() {
        if (this.xpPercentageTillNextLevel() >= 1) {
            this.level++;
            this.maxHealth += 4;
            this.maxMana += 4;
            this.skillPoints++;
            this.health = this.maxHealth;
            this.mana = this.maxMana;
            this.world.game.audio.play('levelUp', 0.5);
            this.world.game.ui.log.addEntry(
                `You've reached level ${
                    this.level + 1
                }! Maximum health increased.`
            );
        }
    }

    /* Gain a certain amount of  XP and check whether a level up is possible */
    xpGain(amount: number) {
        this.xp += amount;
        this.xpLevelUpIfAvailable();
    }

    /* Gain some XP for a certain skill, learning it if necessary */
    skillXpGain(skillId: string, amount: number) {
        if (skillId === '') {
            return;
        }
        const ps = this.skill.get(skillId);
        if (ps) {
            ps.xpGain(amount);
        } else {
            const skill = Skill.get(skillId);
            if (!skill) {
                throw new Error(`Unknown skill: ${skillId}`);
            }
            const nps = new CharacterSkill(this, skill);
            this.skill.set(skillId, nps);
            nps.xpGain(amount);
            if (skill instanceof ActiveSkill) {
                setTimeout(() => {
                    this.world.game.ui.hotbar.add(skill);
                }, 0);
            }
        }
    }

    /* Try to learn a certain skill if possible */
    skillLearn(skillId: string): boolean {
        if (this.skillPoints <= 0) {
            return false;
        }
        const skill = Skill.get(skillId);
        if (!skill) {
            throw new Error(`Unknown skill: ${skillId}`);
        }
        if (!(skill instanceof ActiveSkill)) {
            throw new Error(
                `${skillId} is not an active skill that must be learned by spending skill points`
            );
        }
        this.skillPoints--;
        this.skillXpGain(skillId, 0);
        return true;
    }

    /* Return whether a given skill is already known to our character */
    skillIsLearned(skillId: string): boolean {
        return this.skill.get(skillId) !== undefined;
    }

    /* Return the level of the given skill, or -1 if unknown */
    skillLevel(skillId: string): number {
        return this.skill.get(skillId)?.level || -1;
    }

    skillUse(skillId: string) {
        this.skill.get(skillId)?.use();
    }
}
