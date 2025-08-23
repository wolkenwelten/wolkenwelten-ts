# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
- `npm run dev` - Start development server with hot reload on http://localhost:5137/
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run preview` - Preview built application

### Code Quality
- `npm run check` - Run both circular dependency and type checks
- `npm run check:circular` - Check for circular dependencies using madge
- `npm run check:types` - TypeScript type checking (no emit)
- `npm run format` - Format code using Biome
- `npm test` - Alias for `npm run check`

### Asset Optimization
- `npm run optimize` - Optimize game assets using scripts/optimizeAssets.js

## Architecture Overview

WolkenWelten is a TypeScript-based voxel battle royale game that runs in browsers with optional multiplayer server capabilities. The architecture is split between client and server with shared game logic.

### Core Structure

- **Game Class (`src/game.ts`)** - Abstract base class for both ClientGame and ServerGame, manages the main game loop, world state, and common managers
- **World System (`src/world/`)** - Manages voxel chunks, entities, and world generation using a sparse chunk system (32³ blocks per chunk)
- **Entity System (`src/world/entity/`)** - Hierarchical entities including Being, Character, and specialized types like bombs and projectiles
- **Network Layer (`src/network/`)** - WebSocket-based client-server communication with binary chunk protocols
- **Rendering (`src/client/render/`)** - WebGL2 renderer with specialized mesh types (BlockMesh, VoxelMesh, ParticleMesh, etc.)

### Client-Server Split

**Client (`src/client/`)**:
- `clientGame.ts` - Main client game instance
- `render/` - WebGL2 rendering system with shader management
- `ui/` - DOM-based UI components with CSS modules
- `audio.ts` - Positional audio using Howler.js

**Server (`src/server/`)**:
- `main.ts` - Express server with WebSocket support
- `serverGame.ts` - Authoritative game instance
- `config.ts` - Server configuration
- Serves both development (Vite dev server) and production builds

### Key Systems

**Chunk System**: 32×32×32 block chunks addressed by packed 48-bit keys (16 bits per axis). Chunks are generated on-demand and garbage collected based on player distance.

**Networking**: Uses WebSocket messages with call/reply patterns. Binary protocols for efficient chunk data transfer.

**Rendering Pipeline**: Multi-pass rendering (solid → transparent), frustum culling, texture arrays, and worker-based mesh generation to avoid frame drops.

**Entity Physics**: Custom physics system with collision detection, combat mechanics, and elemental interactions.

## Development Notes

### File Structure Patterns
- CSS modules use `.module.css` extension
- Shaders are co-located with their TypeScript files (`.vert`, `.frag`)
- Server has separate `tsconfig.json` for Node.js environment
- Content registration happens in `src/content/` directory

### Performance Considerations
- Adaptive render distance based on platform (Firefox, Safari, mobile, ARM devices)
- Worker-based mesh generation prevents UI blocking
- Binary chunk protocols for network efficiency
- Greedy meshing algorithm for optimal chunk geometry

### Coordinate System
- Y-up coordinate system (positive Y = sky)
- All coordinates in absolute block units
- Chunk coordinates mask to 16 bits per axis (±32,768 block limit)
- Bottom of world is at Y=900 (kill plane)

### Content System
Block types, items, and game content are registered through centralized systems in `src/content/`. The game supports .vox model files for 3D assets.

### Build System
Uses Vite for bundling with dual entry points (`index.html` for landing page, `game.html` for game). Development mode integrates Vite dev server as Express middleware.

## Code Style and Conventions

- **Indentation**: Always use tabs for indentation
- **Functions**: Prefer arrow functions over function declarations
- **Approach**: Use modern JavaScript features and functional programming patterns
- **Philosophy**: Keep things simple and obviously correct - avoid overcomplplication

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Graphics**: WebGL 2 for client-side rendering
- **Communication**: WebSockets for client-server networking
- **Audio**: Howler.js for positional audio
- **Math**: gl-matrix for vector/matrix operations
- **Assets**: vox-reader for .vox model support
- **Build**: Vite for bundling and development server