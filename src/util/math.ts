/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
export const clamp = (num: number, min: number, max: number) =>
    Math.min(Math.max(num, min), max);

export const abgrToRgba = (c: number): number => {
    return (
        ((c & 0xff) << 24) |
        ((c & 0xff00) << 8) |
        ((c & 0xff0000) >> 8) |
        ((c & 0xff000000) >> 24)
    );
};

export const radianDifference = (α: number, β: number) => {
    const diff = ((β - α + Math.PI) % Math.PI) * 2 - Math.PI;
    return diff < -Math.PI ? diff + Math.PI : diff;
};
