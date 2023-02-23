/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { RenderManager } from '../render/render';
import { clamp } from '../util/math';
import { Character } from './entity/character';
import { MaybeItem } from './item/item';
import { World } from './world';

export interface MiningAction {
    x: number;
    y: number;
    z: number;
    block: number;
    damageDealt: number;
    progress: number;
    v: number;
}

export class MiningManager {
    world: World;
    ticks = 0;
    minings: MiningAction[] = [];

    constructor(world: World) {
        this.world = world;
    }

    private doMine(
        x: number,
        y: number,
        z: number,
        block: number,
        damageDealt: number
    ): boolean {
        const bt = this.world.blocks[block];
        for (const m of this.minings) {
            if (m.x !== x) {
                continue;
            }
            if (m.y !== y) {
                continue;
            }
            if (m.z !== z) {
                continue;
            }
            if (m.block !== block) {
                m.damageDealt = 0;
                m.block = block;
            }
            m.v = 0;
            m.damageDealt += damageDealt;
            const ret = m.damageDealt >= bt.health;
            if (ret) {
                m.damageDealt = -1;
            }
            return ret;
        }
        const m = { x, y, z, block, damageDealt: 0, v: 0, progress: 0 };
        this.minings.push(m);
        const ret = damageDealt >= bt.health;
        if (ret) {
            m.damageDealt = -1;
        }
        return ret;
    }

    mine(player: Character, x: number, y: number, z: number, tool: MaybeItem): boolean {
        const block = this.world.getBlock(x, y, z);
        if (!block) {
            return false;
        }
        const ret = this.doMine(x, y, z, block, tool?.miningDamage(block) || 1);
        if (ret) {
            const bt = this.world.blocks[block];
            this.world.setBlock(x, y, z, 0);
            this.world.game.render.particle.fxBlockBreak(x, y, z, bt);
            this.world.dangerZone.add(x - 1, y - 1, z - 1, 3, 3, 3);
            this.world.game.audio.play('tock');
            bt.spawnMiningDrops(this.world, x, y, z, tool);
            tool?.onMineWith(player, block);
        }
        return ret;
    }

    private playerMine() {
        const player = this.world.game.player;
        if (!player.miningActive) {
            return;
        }
        const tool = player.inventory.active();
        this.mine(player, player.miningX, player.miningY, player.miningZ, tool);
    }

    update() {
        this.playerMine();
        for (let i = this.minings.length - 1; i >= 0; i--) {
            const m = this.minings[i];
            m.damageDealt -= m.v;
            const bt = this.world.blocks[m.block];
            m.progress = clamp(m.damageDealt / bt.health, 0, 1);
            m.v++;
            if (m.damageDealt < 0) {
                this.minings[i] = this.minings[this.minings.length - 1];
                this.minings.length--;
            }
        }
        if ((++this.ticks & 7) == 0) {
            for (let i = this.minings.length - 1; i >= 0; i--) {
                const m = this.minings[i];
                const bt = this.world.blocks[m.block];
                this.world.game.render.particle.fxBlockMine(m.x, m.y, m.z, bt);
            }
        }
        if ((++this.ticks & 63) == 0) {
            for (let i = this.minings.length - 1; i >= 0; i--) {
                const m = this.minings[i];
                this.world.game.audio.play('tock', 0.5);
            }
        }
    }

    draw(renderer: RenderManager) {
        for (const m of this.minings) {
            renderer.decals.addBlock(
                m.x,
                m.y,
                m.z,
                Math.floor(m.progress * 8),
                0
            );
        }
    }
}
