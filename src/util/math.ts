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

export const closestRadian = (from: number, to: number) => {
	const a = to - Math.PI * 2;
	const b = to + Math.PI * 2;
	const ad = Math.abs(from - a);
	const bd = Math.abs(from - b);
	const td = Math.abs(from - to);
	if (ad < bd && ad < td) {
		return a;
	}
	if (bd < ad && bd < td) {
		return b;
	}
	return to;
};

export const easeInSine = (x: number): number =>
	1 - Math.cos((x * Math.PI) / 2);

export const easeOutSine = (x: number): number => Math.sin((x * Math.PI) / 2);

export const easeInOutSine = (x: number): number =>
	-(Math.cos(Math.PI * x) - 1) / 2;

export interface Position {
	x: number;
	y: number;
	z: number;
	yaw: number;
	pitch: number;
}
