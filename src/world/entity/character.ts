import { Entity } from './entity';
import { Inventory } from '../item/inventory';
import { World } from '../world';
import { mat4 } from 'gl-matrix';
import { BlockItem } from '../item/blockItem';
import { TriangleMesh, VoxelMesh } from '../../render/meshes';
import { CrabMeatRaw } from '../item/food/crabMeatRaw';
import { ItemDrop } from './itemDrop';
import { StoneShovel } from '../item/tools/stone/stoneShovel';
import { StoneAxe } from '../item/tools/stone/stoneAxe';
import { StonePickaxe } from '../item/tools/stone/stonePickaxe';
import { Stick } from '../item/material/stick';

const CHARACTER_ACCELERATION = 0.04;
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

    level = 0;
    xp = 0;

    inventory: Inventory;

    init() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.z = this.spawnZ;
        this.xp = this.level = 0;
        this.xp = 0;
        this.yaw = this.spawnYaw;
        this.pitch = this.spawnPitch;
        this.noClip = false;
        this.isDead = false;
        this.maxHealth = this.health = 12;
        this.hitAnimation = -100;
        this.lastAction = 0;
        this.miningActive = false;
        this.miningX = this.miningY = this.miningZ = 0;
        this.vx = this.vy = this.vz = 0;
        this.inventory.clear();
        this.inventory.add(new StonePickaxe(this.world));
        this.inventory.add(new StoneAxe(this.world));
        this.inventory.add(new StoneShovel(this.world));
        this.inventory.add(new CrabMeatRaw(this.world, 3));
        this.inventory.add(new Stick(this.world, 3));
        this.inventory.add(new BlockItem(this.world, 3, 90));

        this.inventory.select(0);
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
        this.inventory = new Inventory(10);
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
                const event = new CustomEvent('playerDead', {
                    detail: {
                        rawAmount,
                    },
                });
                this.world.game.ui.rootElement.dispatchEvent(event);
                this.isDead = true;
                this.onDeath();
                // Dispatch death event
            }
        } else {
            if (this === this.world.game.player) {
                const event = new CustomEvent('playerDamage', {
                    detail: {
                        rawAmount,
                        health: this.health,
                        maxHealth: this.maxHealth,
                    },
                });
                this.world.game.ui.rootElement.dispatchEvent(event);
            }
        }
    }

    heal(rawAmount: number) {
        this.damage(-rawAmount);
    }

    /* Walk/Run according to the direction of the Entity, ignores pitch */
    move(ox: number, oy: number, oz: number) {
        this.inertiaX = this.inertiaX * 0.97 + ox * -0.03;
        this.inertiaZ = this.inertiaZ * 0.97 + oz * -0.03;

        if (ox === 0 && oz === 0) {
            this.movementX = this.movementZ = 0;
        } else {
            this.movementX = ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw);
            this.movementZ = ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw);
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

    update() {
        if (this.isDead) {
            return;
        }

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
        let accel =
            movementLength > 0.01
                ? CHARACTER_ACCELERATION
                : CHARACTER_STOP_RATE;

        if (!this.mayJump()) {
            accel *= 0.4; // Slow down player movement changes during jumps
        }
        if (underwater) {
            accel *= 0.7; // Slow down player movement while underwater
        }

        this.vx = this.vx * (1.0 - accel) + this.movementX * 0.75 * accel;
        this.vz = this.vz * (1.0 - accel) + this.movementZ * 0.75 * accel;
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
        this.miningActive = true;
        this.miningX = x;
        this.miningY = y;
        this.miningZ = z;
    }

    attack(radius = 2): boolean {
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
                this.world.game.render.particle.fxStrike(e.x, e.y, e.z);
                const dm = Math.max(Math.abs(dx), Math.abs(dz));
                const ndx = dx / dm;
                const ndz = dz / dm;
                e.vx += ndx * 0.2;
                e.vy += 0.06;
                e.vz += ndz * 0.2;
                e.damage(weapon?.attackDamage(e) || 1);
                e.onAttack(this);
                if (e.isDead) {
                    this.xpGain(1);
                }
            }
        }

        return hit;
    }

    onDeath() {
        this.world.game.audio.play('ungh', 0.2);
        this.init();
        const event = new CustomEvent('playerDamage', {
            detail: {
                rawAmount: 0,
                health: this.health,
                maxHealth: this.maxHealth,
            },
        });
        this.world.game.ui.rootElement.dispatchEvent(event);
    }

    onAttack(perpetrator: Entity): void {
        this.world.game.render.canvasWrapper.classList.remove('fx-damage');
        this.world.game.render.canvasWrapper.getBoundingClientRect();
        this.world.game.render.canvasWrapper.classList.add('fx-damage');
    }

    strike() {
        if (this.world.game.ticks < this.lastAction) {
            this.dig();
            return;
        }

        if (this.world.game.render.frames > this.hitAnimation + 60) {
            this.hitAnimation = this.world.game.render.frames;
            const hit = this.attack();
            if (hit) {
                this.world.game.audio.play('punch');
            } else {
                this.world.game.audio.play('punchMiss');
            }
            if (this.miningActive) {
                const minedBlock =
                    this.world.getBlock(
                        this.miningX,
                        this.miningY,
                        this.miningZ
                    ) || 0;
                this.world.blocks[minedBlock].playMineSound(this.world);
            }
        } else {
            this.dig();
        }
    }

    useItem() {
        if (this.world.game.ticks < this.lastAction) {
            return;
        }
        const item = this.inventory.active();
        if (!item) {
            return;
        }
        if (item.use(this)) {
            this.hitAnimation = this.world.game.render.frames;
            this.inventory.updateAll();
        }
    }

    dropItem() {
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

    draw(projectionMatrix: mat4, viewMatrix: mat4, cam: Entity) {
        return;
    }

    hudMesh(): VoxelMesh | TriangleMesh {
        const heldItem = this.inventory.active();
        if (!heldItem) {
            return this.world.game.render.meshes.fist;
        } else {
            return heldItem.mesh(this.world);
        }
    }

    xpForLevel(level: number): number {
        return level * 10;
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
            this.world.game.ui.rootElement.dispatchEvent(
                new CustomEvent('playerLevelUp')
            );
            const event = new CustomEvent('playerDamage', {
                detail: {
                    rawAmount: 0,
                    health: this.health,
                    maxHealth: this.maxHealth,
                },
            });
            this.world.game.ui.rootElement.dispatchEvent(event);
            this.world.game.audio.play('levelUp');
        }
    }

    xpGain(amount = 1) {
        this.xp += amount;
        this.xpCheckLevelUp();
        this.world.game.ui.rootElement.dispatchEvent(
            new CustomEvent('playerXp')
        );
    }
}
