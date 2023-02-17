/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { Chunk } from '../chunk/chunk';

export const worldgenUnderground = (chunk: Chunk) => {
    chunk.setBox(0, 0, 0, 32, 32, 32, 3); // Just fill everything with stone for now
};
