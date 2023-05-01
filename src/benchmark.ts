/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from './game';
import { BlockMesh } from './render/meshes/blockMesh/blockMesh';

export class BenchmarkManager {
    game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    private benchmarkChunk(x: number, y: number, z: number): void {
        const chunk = this.game.world.getOrGenChunk(x, y, z);
        chunk.lightLastUpdated = chunk.lastUpdated - 1;
        const mesh = BlockMesh.fromChunk(chunk);
        mesh.destroy();
    }

    meshing(): number {
        let start = 0;
        const coords = [
            [-86, 5, 908],
            [-42, -1, 1015],
        ];

        for (let i = 0; i < 8; i++) {
            if (i === 1) {
                start = performance.now();
            }
            for (const c of coords) {
                for (let ox = -1; ox < 2; ox++) {
                    for (let oy = -1; oy < 2; oy++) {
                        for (let oz = -1; oz < 2; oz++) {
                            this.benchmarkChunk(
                                c[0] + ox * 32,
                                c[1] + oy * 32,
                                c[2] + oz * 32
                            );
                        }
                    }
                }
            }
        }

        const end = performance.now();
        const dur = end - start;
        console.log(`Running the meshing Benchmark took ${dur}ms`);
        return dur;
    }
}
