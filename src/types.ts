/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * TypeScript module augmentation stubs that inform the compiler about Vite's
 * import modifiers (e.g. `?raw`, `?url`) and various asset file types.  Keep
 * this file in sync with new loader plugins you introduce so the editor and
 * tsc stay silent.
 */
declare module "*?raw" {
	const content: string;
	export default content;
}

declare module "*?url" {
	const content: string;
	export default content;
}

declare module "*.png" {
	const content: string;
	export default content;
}

declare module "*.jpg" {
	const content: string;
	export default content;
}

declare module "*.module.css" {
	const content: any;
	export default content;
}
