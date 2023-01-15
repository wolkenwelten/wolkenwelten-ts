import { Chunk } from "./chunk";

const coordinateToWorldKey = (x:number ,y:number, z:number) => ((x >> 5) & 0xFFFF) + (((y >> 5) & 0xFFFF) * (0x10000)) + (((z >> 5) & 0xFFFF) * (0x100000000));

export class World {
    chunks: Map<number, Chunk> = new Map();

    getChunk (x:number, y:number, z:number): Chunk | undefined {
        const chunk = this.chunks.get(coordinateToWorldKey(x,y,z));
        if(chunk){
            if((chunk.x !== x) || (chunk.y !== y) || (chunk.z !== z)){
                throw new Error("coordinateToWorldKey got something wrong: [${x},${y},${z}] !== [${chunk.x},${chunk.y},${chunk.z}]");
            }
        }
        return chunk;
    }

    getOrGenChunk (x:number, y:number, z:number):Chunk {
        const key = coordinateToWorldKey(x,y,z);
        let chunk = this.chunks.get(key);
        if(chunk){return chunk;}
        chunk = new Chunk(x,y,z);
        chunk.setBox(1,1,1,30,30,30,1);

        this.chunks.set(key, chunk);
        return chunk;
    }

    setChunk (x:number, y:number, z:number, chunk: Chunk) {
        this.chunks.set(coordinateToWorldKey(x,y,z), chunk);
    }
}