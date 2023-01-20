import { Entity } from './entity';
import { World } from '../world';

export class Character extends Entity {
    constructor(x: number, y: number, z: number, yaw: number, pitch: number) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
        this.yaw = yaw;
        this.pitch = pitch;
    }

    /* Walk/Run according to the direction of the Entity, ignores pitch */
    move(ox: number, oy: number, oz: number) {
        if (ox === 0 && oz === 0) {
            this.vx *= 0.9;
            this.vz *= 0.9;
        } else {
            const nox = ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw);
            const noz = ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw);
            this.vx = this.vx * 0.96 + nox * 0.04;
            this.vz = this.vz * 0.96 + noz * 0.04;
        }

        if (oy > 0 && this.vy === 0) {
            this.vy += 0.17;
        }
    }

    collidesBottom(world: World) {
        return (
            Boolean(world.getBlock(this.x, this.y - 1, this.z)) ||
            Boolean(world.getBlock(this.x, this.y - 2, this.z))
        );
    }

    collidesFront(world: World) {
        return (
            Boolean(world.getBlock(this.x, this.y, this.z + 1)) ||
            Boolean(world.getBlock(this.x, this.y - 1, this.z + 1))
        );
    }

    collidesBack(world: World) {
        return (
            Boolean(world.getBlock(this.x, this.y, this.z - 1)) ||
            Boolean(world.getBlock(this.x, this.y - 1, this.z - 1))
        );
    }

    collidesLeft(world: World) {
        return (
            Boolean(world.getBlock(this.x - 1, this.y, this.z)) ||
            Boolean(world.getBlock(this.x - 1, this.y - 1, this.z))
        );
    }

    collidesRight(world: World) {
        return (
            Boolean(world.getBlock(this.x + 1, this.y, this.z)) ||
            Boolean(world.getBlock(this.x + 1, this.y - 1, this.z))
        );
    }

    collidesTop(world: World) {
        return (
            Boolean(world.getBlock(this.x, this.y + 1, this.z)) ||
            Boolean(world.getBlock(this.x, this.y, this.z))
        );
    }

    collides(world: World) {
        return (
            this.collidesBack(world) ||
            this.collidesFront(world) ||
            this.collidesLeft(world) ||
            this.collidesRight(world) ||
            this.collidesTop(world) ||
            this.collidesBottom(world)
        );
    }

    update(world: World) {
        if (this.noClip) {
            this.vx = this.vy = this.vz = 0;
            return;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vy -= 0.005;

        if (this.collides(world)) {
            this.vy = 0;
        }

        if (this.vx > 0.01 && this.collidesRight(world)) {
            this.vx *= -0.9;
        }
        if (this.vx < -0.01 && this.collidesLeft(world)) {
            this.vx *= -0.9;
        }
        if (this.vz > 0.01 && this.collidesFront(world)) {
            this.vz *= -0.9;
        }
    }
}
