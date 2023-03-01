/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Never use this in normal source files, it's only there to allow creation
 * of various objects during runtime via the console.
 */

export type ClassType = new (...args: any) => any;

export const classes: Record<string, ClassType> = {};
export const registerClass = (c: ClassType) => {
    classes[c.name] = c;
};
