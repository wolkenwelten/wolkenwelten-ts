/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 * ┃  ClientGame – The browser-side facade of a Wolkenwelten session ☁️🎮     ┃
 * ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
 * ┃ Purpose                                                                  ┃
 * ┃  • Wires together all client-only managers: rendering, audio, UI, input, ┃
 * ┃    and the websocket based `ClientNetwork`.                              ┃
 * ┃  • Owns a DOM container (`config.parent`) that gets filled by the        ┃
 * ┃    `RenderManager` and UI system.                                        ┃
 * ┃  • Keeps an *authoritative* mirror of server state via `ClientNetwork`.   ┃
 * ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
 * ┃ Lifecycle hint                                                           ┃
 * ┃ 1. call `new ClientGame({ parent: <div>, … })`                           ┃
 * ┃ 2. store the return value **somewhere global** – managers use singletons┃
 * ┃ 3. flip `game.running = true` when you are ready to enter the main loop. ┃
 * ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
 * ┃ Hidden dragons 🐉                                                        ┃
 * ┃  • `setPlayerID()` *must* be called once the server assigns an ID,       ┃
 * ┃    otherwise entity IDs collide and replication breaks.                  ┃
 * ┃  • `audio.update()` *requires* the local player entity; null checks are  ┃
 * ┃    done but your soundscape will be silent if `player` isn't set.        ┃
 * ┃  • The constructor touches the DOM right away by instantiating render/UI;┃
 * ┃    ensure `config.parent` is attached to the document first.             ┃
 * ┃  • Any heavy work in `update()` still blocks the UI thread; offload to   ┃
 * ┃    web-workers where possible.                                           ┃
 * ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
 * ┃ Quick reference                                                          ┃
 * ┃  constructor() – sets up managers, calls `super()`                       ┃
 * ┃  init()        – awaits worldgen from base class                         ┃
 * ┃  setPlayerID() – link local player entity + camera, sync entity counter  ┃
 * ┃  update()      – super.update + audio & network                         ┃
 * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
 */
import { Game, GameConfig } from "../game";
import { RenderManager } from "./render/render";
import { UIManager } from "./ui/ui";
import { ClientEntry } from "./clientEntry";
import { ClientNetwork } from "./clientNetwork";
import { InputManager } from "./input";
import { AudioManager } from "./audio";
import { registerAudioContent } from "../content/audioContent";
import { Character } from "../world/entity/character";
import { setEntityCounter } from "../world/entity/entity";

export interface ClientGameConfig extends GameConfig {
	parent: HTMLElement;
	playerName?: string;
}

export class ClientGame extends Game {
	clients: Map<number, ClientEntry> = new Map();
	isClient = true;

	readonly audio: AudioManager;
	readonly config: ClientGameConfig;
	readonly network: ClientNetwork;
	readonly input: InputManager;
	readonly render: RenderManager;
	readonly ui: UIManager;

	/**
	 * Construct a fresh client session. Heavy managers (render/audio/UI…) are
	 * instantiated immediately, so make sure the provided `parent` element is
	 * present in the DOM. `super(config)` sets up the shared world & options.
	 */
	constructor(config: ClientGameConfig) {
		super(config);
		this.config = config;

		this.audio = new AudioManager(this);
		registerAudioContent(this.audio);

		this.network = new ClientNetwork(this);
		this.network.setPlayerName(this.options.playerName);

		this.ui = new UIManager(this);
		this.render = new RenderManager(this);
		this.input = new InputManager(this);
	}

	/**
	 * Finish asynchronous base-class initialisation. Override for your own
	 * boot logic but always `await super.init()` first – it performs world
	 * generation and flips the critical `ready` flag.
	 */
	async init() {
		await super.init();
	}

	/**
	 * Called once by the network layer after the server acknowledged our join.
	 * Sets local `networkID`, adjusts the global entity counter to stay clear
	 * of server-side IDs and spawns the local `Character`. Also hooks the
	 * player entity into the camera so that we instantly start following.
	 */
	setPlayerID(playerID: number) {
		this.networkID = playerID;
		setEntityCounter(playerID << 28);
		this.player = new Character(this.world);
		this.render.camera.entityToFollow = this.player;
	}

	/**
	 * Run one client tick: world simulation (base), audio emitter positions and
	 * websocket polling. `super.update()` may run multiple world ticks to catch
	 * up, so keep your extra logic *light* to avoid jank.
	 */
	update() {
		super.update();
		if (!this.ready || !this.running) {
			return;
		}
		if (this.player) {
			this.render.camera.entityToFollow = this.player;
			this.audio.update(this.player); // Update AudioEmitter positions in case Entities get destroyed
		}
		this.network.update();
	}
}
