import { Chunk } from "./chunk";

const coordinateToWorldKey = (x:number ,y:number, z:number) => ((x >> 5) & 0xFFFF) + (((y >> 5) & 0xFFFF) * (0x10000)) + (((z >> 5) & 0xFFFF) * (0x100000000));

export class World {
    chunks: Map<number, Chunk> = new Map();

    getChunk (x:number, y:number, z:number): Chunk | undefined {
        return this.chunks.get(coordinateToWorldKey(x,y,z));
    }

    getOrGenChunk (x:number, y:number, z:number):Chunk {
        const key = coordinateToWorldKey(x,y,z);
        let chunk = this.chunks.get(key);
        if(chunk){return chunk;}
        chunk = new Chunk(x,y,z);
        chunk.setBlock(16,15,16,1);
        chunk.setBlock(16,16,16,1);
        chunk.setBlock(16,17,16,1);
        chunk.setBlock(16,16,15,1);
        chunk.setBlock(16,16,17,1);
        chunk.setBlock(15,16,16,1);
        chunk.setBlock(17,16,16,1);

        this.chunks.set(key, chunk);
        return chunk;
    }

    setChunk (x:number, y:number, z:number, chunk: Chunk) {
        this.chunks.set(coordinateToWorldKey(x,y,z), chunk);
    }
}