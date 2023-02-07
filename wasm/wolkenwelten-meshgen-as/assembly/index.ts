export function finish_light(light: Uint8Array, blocks: Uint8Array):void {
  lightBlurX(light);
  lightBlurY(light);
  lightBlurZ(light);
  ambientOcclusion(light, blocks);
}

function max(a:i32, b:i32):i32 {
  return a > b ? a : b;
}

function lightBlurX (out: Uint8Array):void {
  for (let y = 0; y < 34; y++) {
      for (let z = 0; z < 34; z++) {
          let a = 0;
          let b = 0;
          for (let x = 0; x < 34; x++) {
              const aOff = x * 34 * 34 + y * 34 + z;
              a = max(a, out[aOff]);
              out[aOff] = a;
              a = max(0, a - 1);

              const bx = 33 - x;
              const bOff = bx * 34 * 34 + y * 34 + z;
              b = max(b, out[bOff]);
              out[bOff] = b;
              b = max(0, b - 1);
          }
      }
  }
}

function lightBlurY (out: Uint8Array):void {
  for (let x = 0; x < 34; x++) {
      for (let z = 0; z < 34; z++) {
          let a = 0;
          let b = 0;
          for (let y = 0; y < 34; y++) {
              const aOff = x * 34 * 34 + y * 34 + z;
              a = max(a, out[aOff]);
              out[aOff] = a;
              a = max(0, a - 1);

              const by = 33 - y;
              const bOff = x * 34 * 34 + by * 34 + z;
              b = max(b, out[bOff]);
              out[bOff] = b;
              b = max(0, b - 1);
          }
      }
  }
}

function lightBlurZ (out: Uint8Array):void {
  for (let x = 0; x < 34; x++) {
      for (let y = 0; y < 34; y++) {
          let a = 0;
          let b = 0;
          for (let z = 0; z < 34; z++) {
              const aOff = x * 34 * 34 + y * 34 + z;
              a = max(a, out[aOff]);
              out[aOff] = a;
              a = max(0, a - 1);

              const bz = 33 - z;
              const bOff = x * 34 * 34 + y * 34 + bz;
              b = max(b, out[bOff]);
              out[bOff] = b;
              b = max(0, b - 1);
          }
      }
  }
}

function ambientOcclusion (out: Uint8Array, blocks: Uint8Array):void {
  const end = 34 * 34 * 34;
  for (let off = 0; off < end; off++) {
      // Here we divide the light value by 2 when the position is occupied by a block
      // Written this way so it's branchless and easier to optimize/vectorize
      if (blocks[off]) {
          out[off] = out[off] >> 1;
      }
  }
}