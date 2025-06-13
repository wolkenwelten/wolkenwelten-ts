/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Represents a single block species that can exist inside a World.
 *
 * A BlockType is effectively a *template* – every block placed in the world only
 * stores its numeric `id`.  All further behaviour (appearance, physics,
 * interaction rules, sounds, fire behaviour, etc.) is resolved through the
 * associated BlockType instance that shares that id.
 *
 * Usage pattern
 * -------------
 * Each BlockType is usually created once at game-start and then registered in
 * the global `World.blockTypes` table (see `world.ts`).  The fluent *builder*
 * helpers (`withTexture…`, `withLiquid`, `withMiningCat`, …) allow you to
 * configure a new instance in a single expression:
 *
 * ```ts
 * world.registerBlock(
 *   new BlockType(42, "Birch Log", "birch")
 *     .withTextureTop(5)
 *     .withTextureBottom(6)
 *     .withTexture(4)           // remaining faces
 *     .withFireHealth(300)
 *     .withMiningCat("Axe")
 * );
 * ```
 *
 * Extending behaviour
 * -------------------
 * If the builder helpers are not sufficient you can subclass BlockType.  Keep
 * in mind that the engine *instantiates* BlockType *once*.  Overriding methods
 * such as `playPlaceSound` or supplying a custom `burnHandler` is usually
 * enough – full subclassing is rarely required.
 *
 * Foot-guns to watch out for 🚧
 * ---------------------------
 * • **Colour conversion** – `withColours` converts from ABGR (little-endian) to
 *   RGBA.  Supplying a normal 0xRRGGBBAA literal will therefore lead to swapped
 *   channels.
 * • **Invisible blocks also become see-through** – `withInvisible(true)` sets
 *   *both* `invisible` *and* `seeThrough`, which is often what you want but can
 *   be surprising when you intend to collide with an invisible barrier.
 * • **Fire behaviour** – setting `fireHealth` or `fireDamage` has no effect
 *   unless you also ensure the block can actually *burn* (i.e. provide an
 *   appropriate `burnHandler`).  Conversely, forgetting to adjust
 *   `fireSpreadToChance` may turn your custom wood into a fire-proof material.
 * • **Audio can be undefined** – `playPlaceSound` / `playMineSound` will do
 *   nothing silently when `world.game.audio` is not initialised, so do not rely
 *   on the return value for game logic.
 *
 * Thread-safety / Mutability
 * --------------------------
 * BlockType instances are intentionally **mutable at start-up** (via the builder
 * helpers) but should be treated as **read-only once the world is running**.
 * Mutating shared instances at runtime will affect *all* blocks of that id.
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

	/**
	 * Creates a new block template.
	 *
	 * @param id       Numeric id that is written into chunk data (must be unique).
	 * @param longName Human-readable name shown in UI/tool-tips.
	 * @param name     Optional short identifier used e.g. for asset look-ups. Defaults to `longName`.
	 */
	constructor(id: number, longName: string, name?: string) {
		this.id = id;
		this.name = name || longName;
		this.longName = longName;
		this.burnHandler = BlockType.defaultBurnHandler;
	}

	/**
	 * Assigns the same texture index to *all* six cube faces.
	 * Useful for most blocks that have a uniform appearance.
	 * Use the directional helpers afterwards to override individual faces.
	 */
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

	/**
	 * Sets the vertex tint colours for the block.
	 * Colours must be supplied in **ABGR** packed 32-bit integer format – *not* the
	 * more common A R G B ordering!  The helper converts them to RGBA internally.
	 */
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

	/**
	 * Makes the block invisible to the renderer *and* see-through for ray-casts / light.
	 * Setting `invisible` to `true` will therefore *always* imply `seeThrough`.
	 * Calling with `false` resets both flags.
	 */
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

	/**
	 * Plays the configured place-sound at full volume.  When no `AudioSystem` is
	 * initialised this call becomes a no-op.
	 */
	playPlaceSound(world: World) {
		world.game.audio?.play(this.placeSound);
	}

	/**
	 * Plays the configured mine-sound at half volume so it blends nicer with other
	 * game audio.  Silently does nothing when the audio subsystem is absent.
	 */
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

	/**
	 * Overrides what should happen when the block has finished burning.
	 * Supplying a handler here does *not* ignite the block – that is controlled by
	 * external fire-logic.  Remember to keep game-state mutations (e.g.
	 * drops/particle effects) inside the main thread.
	 */
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

	/**
	 * Default behaviour when a block burns completely: simply delete the block.
	 * Custom `burnHandler`s can drop items, replace the block with something else,
	 * spawn particles, etc.
	 */
	static defaultBurnHandler(world: World, x: number, y: number, z: number) {
		world.setBlock(x, y, z, 0);
	}
}
