import { Entity } from './entity';
import { Inventory } from '../item/inventory';
import { World } from '../world';
import { blocks } from '../blockType/blockType';
import { mat4 } from 'gl-matrix';
import { BlockItem } from '../item/blockItem';
import { TriangleMesh, VoxelMesh } from '../../render/meshes';

const CHARACTER_ACCELERATION = 0.04;
const CHARACTER_STOP_RATE = CHARACTER_ACCELERATION * 3.0;

const clamp = (x: number, min: number, max: number) =>
    Math.min(Math.max(x, min), max);

export class Character extends Entity {
    movementX = 0;
    movementY = 0;
    movementZ = 0;
    lastAction = 0;
    hitAnimation = -1;
    walkCycleCounter = 0;
    nextStepSound = 0;

    jumpAnimeFactor = 0;
    inertiaX = 0;
    inertiaZ = 0;

    miningX = 0;
    miningY = 0;
    miningZ = 0;
    miningActive = false;

    inventory: Inventory;

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
        this.x = x;
        this.y = y;
        this.z = z;
        this.yaw = yaw;
        this.pitch = pitch;
        this.noClip = noClip;
        this.inventory = new Inventory(10);
        this.inventory.add(new BlockItem(9, 10));
        this.inventory.add(new BlockItem(2, 90));
        this.inventory.add(new BlockItem(3, 90));
        this.inventory.add(new BlockItem(1, 10));
        this.inventory.select(0);
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

    isDead(): boolean {
        return false;
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
        if (this.isDead()) {
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
            if (this.vy < -0.1) {
                this.world.game.audio.play(
                    'stomp',
                    Math.min(1, Math.abs(this.vy) * 2)
                );
            }
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
        if (force > 0.01) {
            // Stomp
        }
        if (force > 0.05) {
            const amount = force * 14.0;
            if (amount > 0) {
                const damage = amount * amount;
                //self.health.damage(damage);
            }
        }

        if (this.isDead()) {
            //reactor.dispatch(Message::CharacterDeath { pos: self.pos });
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
        if (this.world.game.ticks < this.lastAction) {
            return;
        }
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

        if (this.world.game.render.frames > this.hitAnimation + 100) {
            this.hitAnimation = this.world.game.render.frames;
            blocks[minedBlock].playMineSound(this.world);
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
            return this.world.game.render.fistMesh;
        } else {
            return heldItem.mesh(this.world);
        }
    }
}
