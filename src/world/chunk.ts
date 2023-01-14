const coordinateToOffset = (x:number, y:number, z:number) => (x&0x1F) | ((y&0x1F)<<5) | ((z&0x1F)<<10);

export class Chunk {
    blocks: Uint8Array;
    x: number;
    y: number;
    z: number;

    constructor (x:number, y:number, z:number) {
        this.blocks = new Uint8Array(32 * 32 * 32);
        this.x = x;
        this.y = y;
        this.z = z;
    }

    getBlock (x:number, y:number, z:number):number {
        const i = coordinateToOffset(x,y,z);
        return this.blocks[i];
    }

    setBlock (x:number, y:number, z:number, block: number) {
        const i = coordinateToOffset(x,y,z);
        this.blocks[i] = block;
    }
}