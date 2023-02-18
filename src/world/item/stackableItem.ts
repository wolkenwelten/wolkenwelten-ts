/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Character } from '../entity/character';
import { Entity } from '../entity/entity';
import { ItemDrop } from '../entity/itemDrop';
import { World } from '../world';
import { Inventory } from './inventory';
import { Item } from './item';

export class StackableItem extends Item {
    amount: number;

    constructor(world: World, amount: number, name: string) {
        super(world, name);
        this.amount = amount;
    }

    clone(): StackableItem {
        return new (this.constructor as any)(
            this.world,
            this.amount,
            this.name
        );
    }

    mayStackWith(other: StackableItem): boolean {
        return this.constructor === other.constructor;
    }

    addToExistingStacks(inventory: Inventory) {
        for (let i = 0; i < inventory.items.length; i++) {
            const item = inventory.items[i];
            if (!item || !(item instanceof StackableItem)) {
                continue;
            }
            if (
                item.amount >= 99 ||
                !this.mayStackWith(item) ||
                !item.mayStackWith(this)
            ) {
                continue;
            }

            const spaceLeft = 100 - item.amount;
            if (spaceLeft > this.amount) {
                item.amount += this.amount;
                this.destroy();
                return;
            } else {
                this.amount += spaceLeft;
                item.amount -= spaceLeft;
            }
        }
    }

    drop(e: Entity): boolean {
        if (this.amount <= 1) {
            return super.drop(e);
        }
        this.amount--;
        if (e instanceof Character) {
            e.inventory.updateAll();
            e.hitAnimation = e.world.game.render.frames;
            e.cooldown(20);
        }
        const [vx, vz] = e.walkDirection();
        const dropItem = this.clone();
        dropItem.amount = 1;
        const drop = new ItemDrop(e.world, e.x - vx, e.y, e.z - vz, dropItem);
        drop.vy = 0.01;
        drop.vx = vx * -0.1;
        drop.vz = vz * -0.1;
        drop.noCollect = true;
        return false;
    }
}
