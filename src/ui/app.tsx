import { h } from 'preact';
import { DebugPanel } from './components/debugPanel';
import { FpsCounter } from './components/fpsCounter';
import { Crosshair } from './components/crosshair';
import { Signal } from "@preact/signals";

export type DebugInfo = {
    drawn: number;
    culled: number;
    queue: number;
    chunks: number;
    meshes: number;
    player: {
        x: number;
        y: number;
        z: number;
        vx: number;
        vy: number;
        vz: number;
    };
}

type AppProps = {
    fps: Signal<number>;
    debugInfo: Signal<DebugInfo>;
}

export const App = ({fps, debugInfo}: AppProps) => {
    return <div>
        <DebugPanel debugInfo={debugInfo}/>
        <FpsCounter fps={fps}/>
        <Crosshair/>
    </div>;
};

