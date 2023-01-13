import { Chunk } from "../../../world/chunk";
export const meshgen = (chunk: Chunk):Uint8Array => {
    const lightness = (0xF << 4) | 1;
    const ret = [
         0,0,0,1,lightness,
         1,1,0,1,lightness,
         0,1,0,1,lightness,

         1,1,0,1,lightness,
         0,0,0,1,lightness,
         1,0,0,1,lightness,


         1,1,0,2,lightness,
         2,2,0,2,lightness,
         1,2,0,2,lightness,

         2,2,0,2,lightness,
         1,1,0,2,lightness,
         2,1,0,2,lightness,


         0,1,0,3,lightness,
         1,2,0,3,lightness,
         0,2,0,3,lightness,

         1,2,0,3,lightness,
         0,1,0,3,lightness,
         1,1,0,3,lightness,


         1,0,0,5,lightness,
         2,1,0,5,lightness,
         1,1,0,5,lightness,

         2,1,0,5,lightness,
         1,0,0,5,lightness,
         2,0,0,5,lightness,
    ];

    return new Uint8Array(ret);
};