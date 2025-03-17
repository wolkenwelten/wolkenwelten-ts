# WolkenWelten Project Architecture

## Overview
WolkenWelten is a TypeScript-based voxel game engine that runs primarily in the browser, with optional server capabilities for multiplayer. It features a performant voxel world renderer, dynamic chunk generation, entity systems, and elemental combat mechanics. The project uses modern web technologies including WebGL2 for rendering and WebSockets for networking.

## Main Components

1. **Game (src/game.ts)**
   - Central orchestrator that initializes and connects all major systems
   - Manages core game loop timing and updates
   - Holds references to:
     - Player character
     - World instance
     - All manager classes (Audio, Render, Network, UI, etc.)
     - Content registries (blocks, items, etc.)
   - Implements garbage collection for optimized memory usage

2. **World (src/world/world.ts)**
   - Manages chunk storage and entity tracking
   - Coordinates with WorldGen for procedural generation
   - Handles chunk loading/unloading based on player position
   - Contains the DangerZone system for environmental hazards

3. **Rendering System (src/render/)**
   - Modern WebGL2-based renderer with multiple specialized components:
     - `RenderManager`: Core rendering coordinator
     - `WorldRenderer`: Handles chunk mesh generation and rendering
     - `Camera`: Manages view frustum and camera effects
     - Specialized mesh types:
       - `BlockMesh`: Optimized chunk geometry
       - `DecalMesh`: Decals and effects
       - `VoxelMesh`: Static object rendering
       - `ParticleMesh`: Particle effects
   - Uses texture arrays and instancing for performance
   - Implements frustum culling and mesh optimization

4. **Entity System (src/world/entity/)**
   - Hierarchical entity system with base `Entity` class
   - Specialized types:
     - `Being`: Base for living entities
     - `Character`: Player character with inventory and equipment
     - `Mob`: NPCs with AI capabilities
     - `Projectile`: Base class for projectiles and spells
     - `ItemDrop`: Represents items in the world
   - Handles physics, collision, and combat
   - Supports attack callbacks and damage system

5. **UI System (src/ui/)**
   - Component-based UI system using DOM elements
   - Features:
     - Hotbar and inventory management
     - Health display
     - Chat system
     - Debug overlays
   - Includes IconManager for generating block/item icons

6. **Networking (src/network/, src/server/, src/client/)**
   - WebSocket-based client-server architecture
   - Supports:
     - Player state synchronization
     - Chunk data transfer
     - Chat messages
     - Entity updates
   - Uses efficient binary protocols for chunk data

7. **World Generation (src/world/worldGen.ts)**
   - Abstract WorldGen system for different world types
   - Handles:
     - Initial world setup
     - Chunk generation
     - Player spawn points
     - Chunk garbage collection rules

8. **Input System (src/input.ts)**
   - Unified input handling for keyboard, mouse, and gamepad
   - State-based input processing
   - Configurable control mapping

9. **Audio System (src/client/audio/)**
   - Positional audio for immersive sound effects
   - Distance-based volume attenuation
   - Support for ambient and action sounds
   - Audio content registry for centralized management

10. **Content System**
    - Modular registration system for game content
    - Support for:
      - Block types with unique properties
      - Items and inventory management
      - Mobs and AI behaviors
      - Runestones with elemental effects
    - Allows for easy expansion of game content

## Technical Features

1. **Mesh Generation**
   - Optimized greedy meshing algorithm for chunks
   - Separate passes for solid and transparent blocks
   - Worker-based mesh generation to avoid frame drops
   - Ambient occlusion baked into vertex lighting
   - Support for .vox model files for entities and objects

2. **Rendering Pipeline**
   - Multi-pass rendering for transparency
   - Dynamic LOD system based on distance
   - Efficient texture atlas system using WebGL2 texture arrays
   - Frustum culling for optimal performance
   - Camera effects including shake and underwater distortion

3. **Performance Optimizations**
   - Adaptive render distance based on platform capabilities (auto-detection for Firefox, Safari, mobile, and ARM devices)
   - Chunk mesh caching and reuse
   - Efficient memory management for block data
   - Background mesh generation
   - Binary protocol for efficient chunk data transfer

4. **Animation System**
   - Character animation with articulated body parts
   - Support for attack animations and movement
   - Animation state synchronization over network

## Data Flow

1. **Game Loop**
   - Fixed-time physics updates
   - Variable-rate rendering
   - Input processing and state updates
   - Network synchronization (if multiplayer)

2. **World Updates**
   - Chunk loading/unloading based on player position
   - Entity updates and physics
   - Block updates and propagation
   - Environmental systems (water, fire, etc.)

3. **Rendering Process**
   - Camera frustum calculation
   - Chunk visibility determination
   - Mesh updates for modified chunks
   - Multi-pass rendering (solid -> transparent)

4. **Combat System**
   - Attack detection and hitbox calculation
   - Damage application and health management
   - Elemental interactions between attacks
   - Visual and audio feedback for combat events

5. **Client-Server Communication**
   - Binary protocol for efficient data transfer
   - Player position and state updates
   - Chunk data synchronization with version checking
   - Entity state and animation synchronization

This architecture provides a solid foundation for both single-player and multiplayer voxel gaming, with room for expansion through the modular content registration system.