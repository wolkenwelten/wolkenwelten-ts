import { World } from '../world';

export class Entity {
    x = 0;
    y = 0;
    z = 0;
    vx = 0;
    vy = 0;
    vz = 0;

    yaw = 0;
    pitch = 0;
    roll = 0;

    destroyed = false;
    noClip = false;

    /* Walk/Run according to the direction of the Entity, ignores pitch */
    move(ox: number, oy: number, oz: number) {
        const nox = ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw);
        const noz = ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw);
        this.x += nox;
        this.z += noz;
        this.y += oy;
    }

    /* Fly into the direction the Entity is facing */
    fly(ox: number, oy: number, oz: number) {
        const nox =
            (ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw)) *
            Math.cos(-this.pitch);
        const noy = oy + oz * Math.sin(-this.pitch);
        const noz =
            (ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw)) *
            Math.cos(-this.pitch);
        this.x += nox;
        this.y += noy;
        this.z += noz;
    }

    rotate(yaw: number, pitch: number) {
        this.yaw += yaw;
        this.pitch += pitch;
    }

    collides(world: World) {
        return (
            Boolean(world.getBlock(this.x, this.y + 1, this.z)) ||
            Boolean(world.getBlock(this.x, this.y, this.z)) ||
            Boolean(world.getBlock(this.x, this.y - 1, this.z))
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
    }
}