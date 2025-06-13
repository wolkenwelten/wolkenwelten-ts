/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * AudioManager is a small convenience wrapper around the `howler` library.
 *
 * It fulfils three major responsibilities:
 * 1. Central registry for loading/looking-up sound assets via `add()`.
 * 2. Book-keeping of all currently playing positional `AudioEmitter`s so they
 *    can be updated every render tick.
 * 3. Forwarding the listener's position/orientation to Howler for proper 3-D
 *    spatialisation.
 *
 * Usage example:
 * ```ts
 * const audio = new AudioManager(game);
 * audio.add("click", "/assets/sfx/click.wav");
 * audio.play("click");
 *
 * // in your main loop
 * audio.update(playerEntity);
 * ```
 *
 * Extending:
 * You can derive your own class or simply **compose** an `AudioManager` to
 * provide domain-specific helpers.  Overriding `update()` is discouraged
 * because external callers are expected to execute it every frame.
 *
 * Footguns & caveats:
 * • Forgetting to call `update()` each frame will **freeze positional audio**
 *   and orientation resulting in disorienting panning.
 * • `add()` plays the asset once at volume 0 to warm the browser's audio pipeline.  If you
 *   attach your own Howler `onplay` listener you will observe this phantom
 *   playback.
 * • Long-lived looping sounds leak memory if you never call `destroy()` on the
 *   returned `AudioEmitter`.
 * • `playFromEntity()` accepts `stopWhenEntityDestroyed`.  When set to `false`
 *   the sound will continue at the entity's last coordinates which might be
 *   surprising.
 * • `maybeStartBGM()` requires you to have registered an asset named `"bgm"`
 *   beforehand **and** `game.options.noBGM` must not be enabled.
 */
import { Howl, Howler } from "howler";
import type { Entity } from "../world/entity/entity";
import type { ClientGame } from "./clientGame";

export class AudioManager {
	assets: Map<string, string> = new Map();
	emitters: Set<AudioEmitter> = new Set();
	bgm: Howl | null = null;

	/**
	 * Register a new audio asset.
	 *
	 * The asset is stored under `name` and played once at zero volume to prime
	 * the browser's audio pipeline.  This prevents a noticeable delay during the
	 * first "real" playback.
	 */
	add(name: string, url: string) {
		this.assets.set(name, url);
		this.play(name, 0);
	}

	/**
	 * Play a non-positional (centred) sound effect immediately.
	 *
	 * Returns the created `AudioEmitter` so the caller can further manipulate
	 * the Howler instance or destroy it early.
	 */
	play(name: string, volume = 1) {
		const emitter = new AudioEmitter(this, name, volume, [0, 0, 0]);
		this.emitters.add(emitter);
		return emitter;
	}

	/**
	 * Attach the sound to an entity so that it follows the entity in 3-D space.
	 *
	 * If `stopWhenEntityDestroyed` is `true` the emitter automatically stops and
	 * cleans itself up once the entity is flagged as destroyed.
	 */
	playFromEntity(
		name: string,
		volume = 1,
		entity: Entity,
		stopWhenEntityDestroyed = false,
	) {
		const emitter = new AudioEmitter(
			this,
			name,
			volume,
			entity,
			stopWhenEntityDestroyed,
		);
		this.emitters.add(emitter);
		return emitter;
	}

	/**
	 * Play a one-shot sound at an arbitrary world-space position.
	 */
	playAtPosition(name: string, volume = 1, position: [number, number, number]) {
		const emitter = new AudioEmitter(this, name, volume, position);
		this.emitters.add(emitter);
		return emitter;
	}

	/**
	 * MUST be called exactly once per frame with the listener entity (usually
	 * the local player's character) so that positional audio stays in sync.
	 */
	update(listener: Entity) {
		Howler.pos(listener.x, listener.y, listener.z);
		const [x, y, z] = listener.direction(0, 0, -1);
		const [xUp, yUp, zUp] = listener.direction(0, 1, 0);
		Howler.orientation(x, y, z, xUp, yUp, zUp);

		for (const emitter of this.emitters) {
			emitter.update();
		}
	}

	/**
	 * Sets the global master volume.  Thin wrapper around `Howler.volume()`.
	 */
	setVolume(volume: number) {
		Howler.volume(volume);
	}

	/**
	 * Lazily starts looping background music designated by the asset key
	 * `"bgm"`.  Subsequent calls are no-ops.
	 */
	maybeStartBGM() {
		if (this.bgm || this.game.options.noBGM) {
			return;
		}
		const src = this.assets.get("bgm");
		if (!src) {
			throw new Error("bgm not found");
		}

		this.bgm = new Howl({ src: [src], volume: 0.1, loop: true });
		this.bgm.play();
	}

	constructor(private game: ClientGame) {}
}

export class AudioEmitter {
	x: number;
	y: number;
	z: number;
	entity?: Entity;
	stopWhenEntityDestroyed = false;

	manager: AudioManager;
	howl: Howl;

	constructor(
		manager: AudioManager,
		name: string,
		volume = 1.0,
		position: Entity | [number, number, number],
		stopWhenEntityDestroyed = false,
	) {
		this.manager = manager;
		if (Array.isArray(position)) {
			this.x = position[0];
			this.y = position[1];
			this.z = position[2];
		} else {
			this.entity = position;
			this.x = position.x;
			this.y = position.y;
			this.z = position.z;
		}
		const url = manager.assets.get(name);
		if (!url) {
			throw new Error(`Can't find audio called ${name}`);
		}
		this.stopWhenEntityDestroyed = stopWhenEntityDestroyed;
		const destroy = this.destroy.bind(this);
		this.howl = new Howl({ src: [url], volume });
		this.howl.on("end", destroy);
		this.howl.on("stop", destroy);
		this.howl.on("playerror", destroy);
		this.howl.on("loaderror", destroy);
		this.howl.pos(this.x, this.y, this.z);
		this.howl.play();
	}

	destroy() {
		this.entity = undefined;
		this.howl.stop();
		this.manager.emitters.delete(this);
	}

	update() {
		if (this.entity) {
			if (this.entity.destroyed) {
				this.entity = undefined;
				if (this.stopWhenEntityDestroyed) {
					this.destroy();
					return;
				}
			} else {
				this.x = this.entity.x;
				this.y = this.entity.y;
				this.z = this.entity.z;
			}
		}
		this.howl.pos(this.x, this.y, this.z);
	}
}
