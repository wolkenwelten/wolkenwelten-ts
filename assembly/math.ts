/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
export function min(a: i32, b: i32): i32 {
    return a < b ? a : b;
}

export function max(a: i32, b: i32): i32 {
    return a > b ? a : b;
}
