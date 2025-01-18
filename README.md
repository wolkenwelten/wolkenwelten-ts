# WolkenWelten - TS

![Have a screenshot](https://github.com/wolkenwelten/wolkenwelten-screenshots/raw/main/2023-02-13.png)

An open voxel battle royale, where you use the environment to slay your foes.

## Play it!
You can play the latest version here: https://wolkenwelten.github.io/wolkenwelten-ts/

## Hardware support
This game should run somewhat fine on a Raspbery PI 4 in 720p and actually most Android Phones/ChromeBooks, provided you have a GamePad, it runs at a pretty stable 60FPS on my old Pixel 2 phone.

Should work great on most Chromebooks.

## Browser support

### Chrome / Brave / Opera / Vivaldi
Performance should be pretty good, as long as your machine is from the this decade it should get solid 60FPS

### Firefox
Performance isn't great but it should be playable, performance should improve quite a bit once I've moved the meshing to a WASM module, since it seems that integer heavy code is optimized much better in V8.

### Safari
You'll probably only get a couple of FPS in Safari, this is due to a massive performance regression with the WebGL Metal Backend, if you disable that it should easily hit 60FPS (though the meshing is about as slow as in Firefox). Hopefully the regression will be fixed soon.

## Change it!
You don't need to install a thing, everything can run in the Browser:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/wolkenwelten/wolkenwelten-ts)

## Local development
Developing locally will probably give you better performance though, to set up a development environment you only need NodeJS(v16+) and NPM installed

### Initial Setup
Nothing special, just install everything via npm
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
