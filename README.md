# Space Harvest Wreckage - Extreme 2001

You play an astronaut on a spaceship that got shot to pieces by meteorites.

Take care of your fuel and oxygen supply and harvest as many floppy disks as possible, but watch out for the dangerous plasma traps! :3

## Ludum Dare

This game was created for LD52 which had the topic "Harvest", you can find the (somewhat buggy) submitted Version on the LD52 branch and play it [here](https://ld52.wolkenwelten.net/).

## Requirements
- Node JS (v18+) with NPM

## Setup
You need to run the build step once before starting a dev server so that the extruded tileset will be built:
```bash
npm install
npm build
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
