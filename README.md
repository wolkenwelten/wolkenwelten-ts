# WolkenWelten - TS
An experiment in turning the Rust/TS relationship around, writing most of the game in TS and using Rust/WASM for the hot loops.

## Status
Super early, pretty much nothing works whatsoever, so probably not that interesting (yet).

- [X] Setup a WebGL2 context
- [X] Port the BlockMesh/Mesh/TextMesh shaders
- [X] Port parts of the meshgen and use it to build very inefficient voxel meshes
- [X] FPS controls
- [X] Render multiple chunks at once
- [X] Omit hidden faces from voxel meshes
- [X] Use indeces when rendering BlockMeshes
- [X] Greedy meshing
- [X] Only render BlockMesh sides that can be seen
- [X] Non-blocking mesh generation
- [X] Frustum culling
- [X] Simple lighting (ignoring neihbouring chunks)
- [ ] Hidden surface removal across chunk boundaries
- [ ] Complex lighting (across chunk boundaries)
- [ ] Compile the Rust meshgen kernel to WASM and measure the performance difference
- [ ] Port the meshgen kernel to AssemblyScript and compare against the Rust/TS versions

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
You can use the `Complete development` configuration to launch a Vite Dev Server and Chrome with the Debugger hooked up.

Putting/removing breakpoints in the `.ts` files with VS Code in `/src` should then work as expected.
If it does not, please open an issue.

Edit the TypeScript files or assets and the browser should automatically refresh after saving.
