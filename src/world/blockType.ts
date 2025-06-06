/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { abgrToRgba } from "../util/math";
import type { World } from "./world";

export type MiningCat = "Pickaxe" | "Axe";
export type BlockTypeItemDropHandler = (
	world: World,
	x: number,
	y: number,
	z: number,
) => void;

export class BlockType {
	id: number;
	name: string;
	longName: string;

	texTop = 0;
	texBottom = 0;
	texFront = 0;
	texBack = 0;
	texLeft = 0;
	texRight = 0;

	colorA = 0xff8822ff;
	colorB = 0xff11aaff;

	miningCat: MiningCat = "Pickaxe";
	health = 100;
	fireHealth = 1000;
	fireDamage = 1;
	fireSpreadToChance = 0.8;
	liquid = false;
	seeThrough = false;
	invisible = false;

	burnHandler: (world: World, x: number, y: number, z: number) => void;

	icon = "";
	placeSound = "pock";
	mineSound = "tock";

	static defaultBurnHandler(world: World, x: number, y: number, z: number) {
		world.setBlock(x, y, z, 0);
	}

	constructor(id: number, longName: string, name?: string) {
		this.id = id;
		this.name = name || longName;
		this.longName = longName;
		this.burnHandler = BlockType.defaultBurnHandler;
	}

	withTexture(tex: number) {
		this.texTop = tex;
		this.texBottom = tex;
		this.texLeft = tex;
		this.texRight = tex;
		this.texFront = tex;
		this.texBack = tex;
		return this;
	}

	withTextureTop(tex: number) {
		this.texTop = tex;
		return this;
	}

	withTextureBottom(tex: number) {
		this.texBottom = tex;
		return this;
	}

	withTextureFront(tex: number) {
		this.texFront = tex;
		return this;
	}

	withTextureBack(tex: number) {
		this.texBack = tex;
		return this;
	}

	withTextureLeft(tex: number) {
		this.texLeft = tex;
		return this;
	}

	withTextureRight(tex: number) {
		this.texRight = tex;
		return this;
	}

	withColours(a: number, b: number) {
		this.colorA = abgrToRgba(a);
		this.colorB = abgrToRgba(b);
		return this;
	}

	withMiningCat(cat: MiningCat) {
		this.miningCat = cat;
		return this;
	}

	withBlockHealth(health: number) {
		this.health = health;
		return this;
	}

	withLiquid(liquid = true) {
		this.liquid = liquid;
		return this;
	}

	withSeeThrough(seeThrough = true) {
		this.seeThrough = seeThrough;
		return this;
	}

	withInvisible(invisible = true) {
		this.seeThrough = this.invisible = invisible;
		return this;
	}

	withFireHealth(health: number) {
		this.fireHealth = health;
		return this;
	}

	withFireDamage(damage: number) {
		this.fireDamage = damage;
		return this;
	}

	playPlaceSound(world: World) {
		world.game.audio?.play(this.placeSound);
	}

	playMineSound(world: World) {
		world.game.audio?.play(this.mineSound, 0.5);
	}

	withMineSound(url: string) {
		this.mineSound = url;
		return this;
	}

	withPlaceSound(url: string) {
		this.placeSound = url;
		return this;
	}

	withBurnHandler(
		handler: (world: World, x: number, y: number, z: number) => void,
	) {
		this.burnHandler = handler;
		return this;
	}

	withFireSpreadToChance(chance: number) {
		this.fireSpreadToChance = chance;
		return this;
	}
}
