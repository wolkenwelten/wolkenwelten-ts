/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Lightweight environment helpers used throughout the codebase.  Prefer these
 * instead of directly checking `typeof window` or `process` so that conditional
 * paths remain readable and the semantics of "client" vs "server" stay
 * consistent.
 */
export const isServer = () =>
	typeof window === "undefined" && typeof process === "object";
export const isClient = () => !isServer();
