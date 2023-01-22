import { Entity } from '../entity';
import { World } from '../../world';

const CHARACTER_ACCELERATION = 0.05;
const CHARACTER_STOP_RATE = CHARACTER_ACCELERATION * 3.0;

const clamp = (x: number, min: number, max: number) =>
    Math.min(Math.max(x, min), max);

export class Character extends Entity {
    movementX = 0;
    movementY = 0;
    movementZ = 0;
    lastAction = 0;

    constructor(world: World, x: number, y: number, z: number, yaw: number, pitch: number) {
        super(world);
        this.x = x;
        this.y = y;
        this.z = z;
        this.yaw = yaw;
        this.pitch = pitch;
    }

    /* Walk/Run according to the direction of the Entity, ignores pitch */
    move(ox: number, oy: number, oz: number) {
        if (ox === 0 && oz === 0) {
            this.movementX = this.movementZ = 0;
        } else {
            this.movementX = ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw);
            this.movementZ = ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw);
        }

        if (oy > 0 && this.vy === 0) {
            this.movementY = 1;
        } else {
            this.movementY = 0;
        }
    }

    isDead(): boolean {
        return false;
    }

    isUnderwater(): boolean {
        return false;
    }

    mayJump(): boolean {
        return this.world.isSolid(this.x, this.y - 1.7, this.z);
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
            return;
        }

        if (!this.world.isLoaded(this.x, this.y, this.z)) {
            return; // Just freeze the character until we have loaded the area, this shouldn't happen if at all possible
        }
        const underwater = this.isUnderwater();

        const movementLength = Math.sqrt(
            this.movementX * this.movementX + this.movementZ * this.movementZ
        );
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

        if (underwater) {
            this.vx *= 0.99;
            this.vy *= 0.98;
            this.vz *= 0.99;
        }

        if (this.movementY > 0 && this.mayJump()) {
            this.vy = 0.17;
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
        if (this.world.game.ticks < this.lastAction) { return; }
        const ray = this.raycast();
        if (!ray) { return; }
        this.cooldown(20);
        const [x, y, z] = ray;
        this.world.setBlock(x, y, z, 0);
    }

    placeBlock(block = 3) {
        if (this.world.game.ticks < this.lastAction) { return; }
        const ray = this.raycast(true);
        if (!ray) { return; }
        this.cooldown(20);
        const [x, y, z] = ray;
        this.world.setBlock(x, y, z, block);
    }
}
