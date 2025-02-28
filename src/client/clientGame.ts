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

export class ClientGame extends Game {
	clients: Map<number, ClientEntry> = new Map();
	isClient = true;

	readonly audio: AudioManager;
	readonly network: ClientNetwork;
	readonly input: InputManager;
	readonly render: RenderManager;
	readonly ui: UIManager;

	constructor(config: GameConfig) {
		super(config);

		this.audio = new AudioManager();
		registerAudioContent(this.audio);

		this.network = new ClientNetwork(this);
		this.network.setPlayerName(this.options.playerName);

		this.ui = new UIManager(this);
		this.render = new RenderManager(this, this.player);
		this.input = new InputManager(this);
	}

	update() {
		super.update();
		if (!this.ready || !this.running) {
			return;
		}
		this.audio.update(this.player); // Update AudioEmitter positions in case Entities get destroyed
	}
}
