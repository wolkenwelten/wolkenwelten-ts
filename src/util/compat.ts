export const isServer = () =>
	typeof window === "undefined" && typeof process === "object";
export const isClient = () => !isServer();
