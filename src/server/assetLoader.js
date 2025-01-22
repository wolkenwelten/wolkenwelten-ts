/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { URL } from "url";
import { readFile } from "fs/promises";

export async function load(url, context, nextLoad) {
	const checkUrl = url.split("?")[0]; // Cutting the possible search parameters
	if (
		checkUrl.endsWith(".css") ||
		checkUrl.endsWith(".ogg") ||
		checkUrl.endsWith(".png") ||
		checkUrl.endsWith(".jpg") ||
		checkUrl.endsWith(".vox") ||
		checkUrl.endsWith(".vert") ||
		checkUrl.endsWith(".frag")
	) {
		const content = await readFile(new URL(url));
		return {
			format: "module",
			source: `export default ${JSON.stringify(content.toString())};`,
			shortCircuit: true,
		};
	}
	return nextLoad(url);
}
