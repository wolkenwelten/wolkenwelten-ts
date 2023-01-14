# WolkenWelten - TS

An experiment in turning the Rust/TS relationship around, writing most of the game in TS and using Rust/WASM for the hot loops.

## Status
Super early, nothing works whatsoever, so probably not that interesting (yet).

## Preview
You can see the current state of the main branch here: https://wolkenwelten.github.io/wolkenwelten-ts/

## Requirements
- Node JS (v18+) with NPM

## Setup
Nothing special, just install everything with npm
```bash
npm install
```

## Development (VS Code)

You can use the `Complete development` a Vite Dev Server and Chrome with the Debugger hooked up.

Putting/removing breakpoints in the `.ts` files with VS Code in `/src` should then work.
If it does not, please open an issue.

Edit the TypeScript files, the browser should automatically refresh after saving.

## Development (Terminal)

You can also start the development server by executing the following command within the repo:
```bash
npm run dev
```

You should then see the example in your Browser on http://localhost:5137/
