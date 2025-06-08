/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
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

	async init() {
		await super.init();
	}

	setPlayerID(playerID: number) {
		this.networkID = playerID;
		setEntityCounter(playerID << 28);
		this.player = new Character(this.world);
		this.render.camera.entityToFollow = this.player;
	}

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
