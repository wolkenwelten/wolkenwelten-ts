# WolkenWelten - TS

![Have a screenshot](https://github.com/wolkenwelten/wolkenwelten-screenshots/raw/main/2023-02-04.png)

A Voxel engine for the Web that respects your freedom.

Runs on a Raspberry Pi 4. Fits on a 1.44MB floppy.

## Try it!
You can play the newest version here: https://wolkenwelten.github.io/wolkenwelten-ts/

## History
While integrating V8 into my Rust Voxel engine, I started experimenting with turning things around, writing most of the engine in TypeScript and using WASM for the tricky bits. Turns out Chrome/Safari are plenty fast and run at ~60FPS on my ~10 year old workstation already without having to use WASM (Firefox sadly seems to be quite slow at anything WebGL related).

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
- [X] Buggy placeholder player physics
- [X] Simple Chunk/BlockMesh GC
- [X] Integrate Preact for the UI
- [X] Simple place/removal of blocks
- [X] Hidden surface removal across chunk boundaries
- [X] Complex lighting (across chunk boundaries)
- [X] Water
- [X] Allow importing of .vox assets
- [X] Use .vox assets for worldgen (trees/plants and so on)
- [X] Simple Mining (drop items after mining)
- [X] Player Inventory (drop/pickup/block place/active item)
- [X] Simple shadows
- [X] Proper Mining
- [X] Simple particle effect system
- [X] Simple SFX

- [ ] Compile the Rust meshgen kernel to WASM and measure the performance difference
- [ ] Port the meshgen kernel to AssemblyScript and compare against the Rust/TS versions

## Hardware Support
I try to make sure that it also runs on cheap/older hardware and regularly test on my Raspberry PI 4 which gets ~50-60FPS at 720p in Chromium (make sure to use the 64-bit version). Additionally I make sure that it runs on an old Sandybridge x220 Thinkpad (Linux is much more performant here, although it kinda runs on Win10).

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
