import { TriangleMesh, VoxelMesh } from '../../render/meshes';
import { blocks } from '../blockType/blockType';
import { Character } from '../entity/character';
import { Entity } from '../entity/entity';
import { ItemDrop } from '../entity/itemDrop';
import { World } from '../world';
import { Inventory } from './inventory';
import { Item } from './item';

export class BlockItem extends Item {
    blockType: number;
    amount: number;

    constructor(blockType: number, amount: number) {
        const bt = blocks[blockType];
        if (!bt) {
            throw new Error(`Invalid blockType: ${blockType}`);
        }
        super(bt.name);

        this.blockType = blockType;
        this.amount = amount;
    }

    clone(): BlockItem {
        return new BlockItem(this.blockType, this.amount);
    }

    use(e: Entity): boolean {
        if (this.destroyed) {
            return false;
        }
        const ray = e.raycast(true);
        if (!ray) {
            return false;
        }
        const [x, y, z] = ray;
        blocks[this.blockType].playPlaceSound(e.world);
        e.world.setBlock(x, y, z, this.blockType);
        if (--this.amount <= 0) {
            this.destroy();
        }

        e.cooldown(20);
        return true;
    }

    icon(): string {
        return blocks[this.blockType].icon;
    }

    addToExistingStacks(inventory: Inventory) {
        for (let i = 0; i < inventory.items.length; i++) {
            const item = inventory.items[i];
            if (!item || !(item instanceof BlockItem)) {
                continue;
            }
            if (item.amount >= 99 || item.blockType !== this.blockType) {
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

    mesh(world: World): TriangleMesh | VoxelMesh {
        return (
            world.game.render.blockTypeMeshes[this.blockType] ||
            world.game.render.bagMesh
        );
    }

    drop(e: Entity): boolean {
        if (this.amount <= 1) {
            return Item.prototype.drop.call(this, e);
        }
        this.amount--;
        if (e instanceof Character) {
            e.inventory.updateAll();
            e.hitAnimation = e.world.game.render.frames;
            e.cooldown(20);
        }
        const [vx, vz] = e.walkDirection();
        const drop = new ItemDrop(
            e.world,
            e.x - vx,
            e.y,
            e.z - vz,
            new BlockItem(this.blockType, 1)
        );
        drop.vy = 0.01;
        drop.vx = vx * -0.1;
        drop.vz = vz * -0.1;
        drop.noCollect = true;
        return false;
    }
}
