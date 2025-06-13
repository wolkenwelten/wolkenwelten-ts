/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { register } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const parentURL = pathToFileURL(dirname(fileURLToPath(import.meta.url)));
register("./server/assetLoader.js", parentURL);
