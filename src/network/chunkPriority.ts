/* Copyright 2026 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */

export type ChunkPriorityContext = {
	chunkX: number;
	chunkY: number;
	chunkZ: number;
	playerX: number;
	playerY: number;
	playerZ: number;
	yaw: number;
	pitch: number;
};

const VERTICAL_DISTANCE_PENALTY = 1.25;
const VIEW_BONUS = 4096;

const normalize = (x: number, y: number, z: number): [number, number, number] => {
	const len = Math.sqrt(x * x + y * y + z * z);
	if (len <= 0.000001) {
		return [0, 0, 1];
	}
	return [x / len, y / len, z / len];
};

export const chunkPriorityScore = ({
	chunkX,
	chunkY,
	chunkZ,
	playerX,
	playerY,
	playerZ,
	yaw,
	pitch,
}: ChunkPriorityContext): number => {
	// Compare from chunk centers to avoid bias around chunk boundaries.
	const dx = chunkX + 16 - playerX;
	const dy = chunkY + 16 - playerY;
	const dz = chunkZ + 16 - playerZ;

	const weightedDistance =
		dx * dx + dz * dz + dy * dy * VERTICAL_DISTANCE_PENALTY;

	const [viewX, viewY, viewZ] = normalize(
		Math.sin(yaw) * Math.cos(pitch),
		-Math.sin(pitch),
		Math.cos(yaw) * Math.cos(pitch),
	);

	const [dirX, dirY, dirZ] = normalize(dx, dy, dz);
	const viewDot = dirX * viewX + dirY * viewY + dirZ * viewZ;

	return -weightedDistance + viewDot * VIEW_BONUS;
};
