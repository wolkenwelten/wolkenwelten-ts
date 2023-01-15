# WolkenWelten - TS
An experiment in turning the Rust/TS relationship around, writing most of the game in TS and using Rust/WASM for the hot loops.

## Status
Super early, pretty much nothing works whatsoever, so probably not that interesting (yet).

- [X] Setup a WebGL2 context
- [X] Port the BlockMesh/Mesh/TextMesh shaders
- [X] Port parts of the meshgen and use it to build very inefficient voxel meshes
- [ ] FPS controls
- [ ] Render multiple chunks at once
- [ ] Omit hidden faces from voxel meshes
- [ ] Greedy meshing
- [ ] Compile the Rust meshgen to WASM and measure the performance difference

## Preview
You can see the current state of the main branch here: https://wolkenwelten.github.io/wolkenwelten-ts/

## Development
To set up a development environment you only need NodeJS(v16+) and NPM installed

### Initial Setup
Nothing special, just install everything with npm
```bash
npm install
```

### Development (Terminal)
You can also start the development server by executing the following command within the repo:
```bash
npm run dev
```
You should now be able to see the game in your Browser on http://localhost:5137/


### Development (VS Code)
You can use the `Complete development` a Vite Dev Server and Chrome with the Debugger hooked up.

Putting/removing breakpoints in the `.ts` files with VS Code in `/src` should then work.
If it does not, please open an issue.

Edit the TypeScript files, the browser should automatically refresh after saving.
