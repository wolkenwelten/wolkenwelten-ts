/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../render/asset';
import { Entity } from '../entity/entity';
import { ItemDrop } from '../entity/itemDrop';
import { World } from '../world';
import { Inventory } from './inventory';

import itemIcon from '../../../assets/gfx/items/crabMeatRaw.png';
import { Character } from '../entity/character';
let idCounter = 0;

export type MaybeItem = Item | undefined;

export class Item {
    id: number;
    name: string;
    world: World;
    destroyed = false;

    constructor(world: World, name: string) {
        this.id = ++idCounter;
        this.name = name;
        this.world = world;
    }

    clone(): Item {
        return new Item(this.world, this.name);
    }

    destroy() {
        this.destroyed = true;
    }

    icon(): string {
        return itemIcon;
    }

    use(e: Entity) {
        if (e instanceof Character) {
            e.strike();
        }
    }

    attackDamage(e: Entity): number {
        return 1;
    }

    miningDamage(block: number): number {
        return 0;
    }

    dropAll(e: Entity): boolean {
        const drop = new ItemDrop(e.world, e.x, e.y, e.z, this);
        const [vx, vz] = e.walkDirection();
        drop.vy = 0.01;
        drop.vx = vx * -0.1;
        drop.vz = vz * -0.1;
        drop.noCollect = true;
        return true;
    }

    drop(e: Entity): boolean {
        return this.dropAll(e);
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return world.game.render.assets.bag;
    }

    addToExistingStacks(inventory: Inventory) {}
}
