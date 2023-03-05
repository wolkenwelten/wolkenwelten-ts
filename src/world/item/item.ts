/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh } from '../../render/meshes/triangleMesh/triangleMesh';
import { VoxelMesh } from '../../render/meshes/voxelMesh/voxelMesh';
import { Character } from '../character';
import { Entity } from '../entity/entity';
import { World } from '../world';

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
    attackSkill: string[] = [];
    amount = 1;
    stackSize = 1;

    isWeapon = false;
    isShield = false;
    isHeadwear = false;
    isTorsowear = false;
    isLegwear = false;
    isFootwear = false;

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

    use(e: Entity) {
        if (e instanceof Character) {
            e.strike();
        }
    }

    attackDamage(e: Entity): number {
        return 0;
    }

    miningDamage(block: number): number {
        return 0;
    }

    attackCooldown(e: Entity): number {
        return 100;
    }

    onAttackWith(e: Entity) {
        if (e instanceof Character) {
            for (const id of this.attackSkill) {
                e.skillXpGain(id, 1);
            }
        }
    }

    mayStackWith(other: Item): boolean {
        return this.constructor === other.constructor;
    }

    onMineWith(e: Entity, block: number) {}
}
