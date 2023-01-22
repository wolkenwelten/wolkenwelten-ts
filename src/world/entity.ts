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
    world: World;

    constructor(world: World) {
        this.world = world;
    }

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
        const [nox, noy, noz] = this.direction(ox,oy,oz);
        this.x += nox;
        this.y += noy;
        this.z += noz;
    }

    rotate(yaw: number, pitch: number) {
        this.yaw += yaw;
        this.pitch += pitch;
    }

    collides() {
        return (
            Boolean(this.world.getBlock(this.x, this.y + 1, this.z)) ||
            Boolean(this.world.getBlock(this.x, this.y, this.z)) ||
            Boolean(this.world.getBlock(this.x, this.y - 1, this.z))
        );
    }

    update() {
        if (this.noClip) {
            this.vx = this.vy = this.vz = 0;
            return;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vy -= 0.005;

        if (this.collides()) {
            this.vy = 0;
        }
    }

    direction(ox = 0, oy = 0, oz = 1, vel = 1): [number, number, number] {
        const nox =
            (ox * Math.cos(-this.yaw) + oz * Math.sin(this.yaw)) *
            Math.cos(-this.pitch);
        const noy = oy + oz * Math.sin(-this.pitch);
        const noz =
            (ox * Math.sin(-this.yaw) + oz * Math.cos(this.yaw)) *
            Math.cos(-this.pitch);
        return [nox * vel, noy * vel, noz * vel];
    }

    raycast(returnFront = false):[number, number, number] | null {
        const [dx,dy,dz] = this.direction(0,0,-1,0.0625);
        let x = this.x;
        let y = this.y;
        let z = this.z;
        let lastX = Math.floor(this.x);
        let lastY = Math.floor(this.y);
        let lastZ = Math.floor(this.z);
        if(this.world.isSolid(lastX, lastY, lastZ)) {
            return [lastX,lastY,lastZ];
        }

        for(let i = 0; i < 64; i++) {
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            const iz = Math.floor(z);
            if(ix != lastX || iy != lastY || iz != lastZ) {
                if(this.world.isSolid(ix, iy, iz)) {
                    return returnFront ? [lastX,lastY,lastZ] : [ix,iy,iz];
                }
                lastX = ix;
                lastY = iy;
                lastZ = iz;
            }
            x += dx;
            y += dy;
            z += dz;
        }
        return null;
    }
}
