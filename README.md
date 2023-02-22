# WolkenWelten - TS

![Have a screenshot](https://github.com/wolkenwelten/wolkenwelten-screenshots/raw/main/2023-02-13.png)

A Voxel engine for the Web that respects your freedom.

Runs on a Raspberry Pi 4. Fits on a 1.44MB floppy.

## Play it!
You can play the newest build here: https://wolkenwelten.github.io/wolkenwelten-ts/

## Develop it!
You don't need to install a thing, everything can run in the Browser:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/wolkenwelten/wolkenwelten-ts)

## Hardware Support
This game should run somewhat fine on a Raspbery PI 4 in 720p and actually most Android Phones/ChromeBooks, provided you have a GamePad, it runs at a pretty stable 60FPS on my old Pixel 2.

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

## Status
Still quite early, however a lot of things already work (somewhat).

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
- [X] Player Inventory (drop/pickup/block place/activate item)
- [X] Simple shadows
- [X] Proper Mining
- [X] Simple particle effect system
- [X] Simple SFX
- [X] GamePad controls
- [X] Simple fluid physics
- [X] (Pick)Axe's
- [X] Simple crafting system
- [X] Voxel Objects/Blocks
- [ ] 3D Sound / Distance-based Volume attenuation