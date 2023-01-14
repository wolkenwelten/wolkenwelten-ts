export class Chunk {
    blocks: Uint8Array;

    constructor () {
        this.blocks = new Uint8Array(32 * 32 * 32);
    }
}