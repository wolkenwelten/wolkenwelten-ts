import { Game } from './game';
import { render, h } from 'preact';
import { signal, Signal } from "@preact/signals";
import { App, DebugInfo } from './ui/app';

export class UIManager {
    game: Game;
    uiRoot: HTMLElement;
    fps = signal(0);
    debugInfo:Signal<DebugInfo> = signal({
        drawn: 0,
        culled: 0,
        queue: 0,
        chunks: 0,
        meshes: 0,
        player: {
            x: 0,
            y: 0,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
        },
    });

    constructor(game: Game) {
        this.game = game;
        this.uiRoot = document.createElement('div');
        this.uiRoot.id = 'wolkenwelten-ui-root';
        game.rootElement.append(this.uiRoot);
        render(<App fps={this.fps} debugInfo={this.debugInfo}/>, this.uiRoot);
    }

    updateFPS(fps: number) {
        this.fps.value = fps;
    }

    updateDebugInfo() {
        const player = this.game.player;
        this.debugInfo.value = {
            drawn: this.game.render.world.chunksDrawn,
            culled: this.game.render.world.chunksSkipped,
            queue: this.game.render.world.generatorQueue.length,
            chunks: this.game.world.chunks.size,
            meshes: this.game.render.world.meshes.size,
            player: {
                x: player.x,
                y: player.y,
                z: player.z,
                vx: player.vx,
                vy: player.vy,
                vz: player.vz,
            },
        };
    }
}
