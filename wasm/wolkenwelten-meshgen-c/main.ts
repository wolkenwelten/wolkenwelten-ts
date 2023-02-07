WebAssembly.instantiateStreaming(fetch("simple.wasm"), importObject).then(
    (results) => {
      // Do something with the results!
    }
  );


export const finish_light = (light:Uint8Array, block:Uint8Array) => {

};
