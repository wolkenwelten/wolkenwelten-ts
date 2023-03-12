/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { TriangleMesh } from '../../render/meshes/triangleMesh/triangleMesh';
import type { VoxelMesh } from '../../render/meshes/voxelMesh/voxelMesh';
import type { Entity } from '../entity/entity';
import type { World } from '../world';
import type { Character } from '../entity/character';

let idCounter = 0;

export type MaybeItem = Item | undefined;
type ItemConstructor = new (world: World, amount: number) => Item;

export class Item {
    id: number;
    icon = '';
    meshUrl = '';
    name = '';
    world: World;
    destroyed = false;
    amount = 1;
    stackSize = 1;

    isWeapon = false;

    static registry: Map<string, ItemConstructor> = new Map();
    static register(name: string, con: ItemConstructor) {
        this.registry.set(name, con);
    }

    static create(name: string, world: World, amount = 1) {
        const con = this.registry.get(name);
        if (con) {
            return new con(world, amount);
        } else {
            throw new Error(`Unknown Item ${name}`);
        }
    }

    constructor(world: World, amount = 1) {
        this.id = ++idCounter;
        this.amount = amount;
        this.world = world;
    }

    clone(): Item {
        return new (this as any).__proto__.constructor(this.world, this.amount);
    }

    destroy() {
        this.destroyed = true;
    }

    mesh(): TriangleMesh | VoxelMesh {
        return (
            this.world.game.render.assets.get(this.meshUrl) ||
            this.world.game.render.assets.bag
        );
    }

    use(e: Character) {
        e.strike();
    }

    attackDamage(e: Entity): number {
        return 0;
    }

    attackCooldown(e: Entity): number {
        return 100;
    }

    onAttackWith(e: Character) {}

    mayStackWith(other: Item): boolean {
        return this.constructor === other.constructor;
    }
}
