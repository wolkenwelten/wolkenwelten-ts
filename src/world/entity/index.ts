import { Bomb } from "./bomb";
import { Character } from "./character";
import { registerNetworkObject } from "./networkObject";

export * from "./being";
export * from "./entity";
export * from "./character";
export * from "./bomb";
export * from "./networkObject";

export const registerNetworkObjects = () => {
	registerNetworkObject("Bomb", Bomb);
	registerNetworkObject("Character", Character);
};
