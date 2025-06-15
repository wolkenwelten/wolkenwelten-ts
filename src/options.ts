/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { GameConfig } from "./game";
import { isClient } from "./util/compat";

const randomNames = [
	"Asuka Langley",
	"Lain Iwakura",
	"Faye Valentine",
	"Spike Spiegel",
	"Ranma Saotome",
	"Lum",
	"Rokuro Okajima",
	"Edward Elric",
	"Eikichi Onizuka",
	"Tsukasa Hiiragi",
];

const getRandomPlayerName = () => {
	const i = (Math.random() * randomNames.length) | 0;
	return randomNames[i];
};

export class Options {
	skipMenu = false;
	noBGM = false;
	playerName: string;
	debug = false;

	private parseBoolean(def: boolean, paramValue: string | null): boolean {
		if (paramValue === null) {
			return def;
		}
		switch (paramValue.trim().toLowerCase()) {
			case "1":
			case "on":
			case "true":
				return true;
			case "0":
			case "off":
			case "false":
				return false;
		}
		return def;
	}

	/*
    private parseNumber(def: number, paramValue: string | null) {
        if (paramValue === null) {
            return def;
        }
        const v = parseInt(paramValue);
        return v !== undefined ? v : def;
    }
    */

	constructor(config: GameConfig) {
		if (isClient()) {
			const params = new URLSearchParams(window.location.search);
			this.debug = window.location.hostname === "localhost";
			this.skipMenu = window.location.hostname === "localhost";
			this.skipMenu = this.parseBoolean(this.skipMenu, params.get("skipMenu"));
			this.noBGM = this.parseBoolean(this.noBGM, params.get("noBGM"));
			this.playerName = params.get("playerName") || getRandomPlayerName();
		} else {
			this.skipMenu = true;
			this.playerName = "";
			this.debug = config.debug || false;
		}
	}
}
