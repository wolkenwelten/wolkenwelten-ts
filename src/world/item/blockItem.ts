import { TriangleMesh, VoxelMesh } from '../../render/asset';
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
        super(world, bt.name, amount);
        this.blockType = blockType;
    }

    clone(): BlockItem {
        return new BlockItem(this.world, this.blockType, this.amount);
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
        this.world.blocks[this.blockType].playPlaceSound(e.world);
        e.world.setBlock(x, y, z, this.blockType);
        this.world.dangerZone.add(x - 1, y - 1, z - 1, 3, 3, 3);
        if (--this.amount <= 0) {
            this.destroy();
        }

        e.cooldown(20);
        return true;
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
