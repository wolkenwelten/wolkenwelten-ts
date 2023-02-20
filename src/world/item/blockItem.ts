/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { TriangleMesh, VoxelMesh } from '../../render/asset';
import { Character } from '../entity/character';
import { Entity } from '../entity/entity';
import { World } from '../world';
import { StackableItem } from './stackableItem';

export class BlockItem extends StackableItem {
    blockType: number;

    constructor(world: World, blockType: number, amount: number) {
        const bt = world.blocks[blockType];
        if (!bt) {
            throw new Error(`Invalid blockType: ${blockType}`);
        }
        super(world, amount, bt.longName || bt.name);
        this.blockType = blockType;
    }

    clone(): BlockItem {
        return new BlockItem(this.world, this.blockType, this.amount);
    }

    use(e: Entity) {
        if (
            this.destroyed ||
            (e instanceof Character && this.world.game.ticks < e.lastAction)
        ) {
            return;
        }

        const ray = e.raycast(true);
        if (!ray) {
            return;
        }
        const [x, y, z] = ray;
        this.world.blocks[this.blockType].playPlaceSound(e.world);
        e.world.setBlock(x, y, z, this.blockType);
        this.world.dangerZone.add(x - 1, y - 1, z - 1, 3, 3, 3);
        if (--this.amount <= 0) {
            this.destroy();
        }

        e.cooldown(32);
        if (e instanceof Character) {
            e.hitAnimation = this.world.game.render.frames;
            e.inventory.updateAll();
        }
        return;
    }

    icon(): string {
        return this.world.blocks[this.blockType].icon;
    }

    mayStackWith(other: StackableItem): boolean {
        if (other instanceof BlockItem) {
            return other.blockType === this.blockType;
        } else {
            return false;
        }
    }

    mesh(world: World): TriangleMesh | VoxelMesh {
        return (
            world.game.render.assets.blockType[this.blockType] ||
            world.game.render.assets.bag
        );
    }
}
