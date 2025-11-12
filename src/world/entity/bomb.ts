/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 */
import type { ServerGame } from "../../server/serverGame";
import type { World } from "../world";
import type { Character } from "./character";
import { Entity } from "./entity";
import { registerNetworkObject } from "./networkObject";

export class Bomb extends Entity {
	T = "Bomb";
	ticksLeft = -1;
	throwerID = 0;

	constructor(world: World, id?: number) {
		super(world, id);
	}

	serialize() {
		return {
			...super.serialize(),
			ticksLeft: this.ticksLeft,
			throwerID: this.throwerID,
		};
	}

	deserialize(data: any) {
		super.deserialize(data);
		this.ticksLeft = data.ticksLeft;
		this.throwerID = data.throwerID;
	}

	explode() {
		this.destroy();
		if (this.world.game.isServer) {
			this.world.setSphere(this.x, this.y, this.z, 8, 0);
			const game = this.world.game as ServerGame;
			for (const player of game.sockets.values()) {
				player.q.call("explode", {
					x: this.x,
					y: this.y,
					z: this.z,
					radius: 8,
					damage: 8,
					attackerID: this.throwerID,
				});
			}
		}
	}

	update() {
		if (this.ownerID !== this.world.game.networkID) {
			return;
		}
		super.update();
		if (this.ticksLeft >= 0) {
			if (--this.ticksLeft <= 0) {
				this.explode();
				return;
			}
			return;
		}
		const players = this.world.getNetworkObjectsByType(
			"Character",
		) as Character[];
		for (const player of players) {
			if (player.equipedItem) {
				continue;
			}
			const dx = this.x - player.x;
			const dy = this.y - player.y;
			const dz = this.z - player.z;
			const d = Math.cbrt(dx * dx + dy * dy + dz * dz);
			if (d < 2.8) {
				this.vx -= (dx / d) * 0.01;
				this.vy -= (dy / d) * 0.01;
				this.vz -= (dz / d) * 0.01;
				this.y += 0.001;
			}
			if (d < 1.6) {
				if (
					this.world.game.isClient &&
					this.ownerID === this.world.game.networkID &&
					player.ownerID === this.world.game.networkID
				) {
					player.equipedItem = "Bomb";
					this.destroy();
				} else {
					this.changeOwner(player.ownerID);
					return;
				}
			}
		}
	}

	mesh() {
		return this.world.game.render?.assets.bomb || null;
	}

	static spawn(world: World) {
		const players = world.getNetworkObjectsByType("Character");
		if (players.length === 0) {
			return;
		}
		if (Math.random() > 0.005) {
			return;
		}
		const player = players[world.game.networkID % players.length] as Character;

		const bomb = new Bomb(world);
		bomb.x = player.x + Math.random() * 50 - 25;
		bomb.y = player.y + Math.random() * 50 - 25 + 30;
		bomb.z = player.z + Math.random() * 50 - 25;
		world.addEntity(bomb);
	}

	static update(world: World) {
		if (world.game.isClient) {
			return;
		}
		if ((world.game.ticks & 0x10) !== 0) {
			return;
		}

		const bombs = world.getNetworkObjectsByType("Bomb");
		if (bombs.length < 10) {
			Bomb.spawn(world);
		}
	}
}
registerNetworkObject("Bomb", Bomb);
