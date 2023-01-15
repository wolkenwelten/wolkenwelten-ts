import { Entity } from './entity';

export class Character extends Entity {
    constructor(x: number, y: number, z: number, yaw: number, pitch: number) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
        this.yaw = yaw;
        this.pitch = pitch;
    }
}
