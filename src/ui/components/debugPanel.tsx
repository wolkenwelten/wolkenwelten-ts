import { h, FunctionComponent } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import styles from './debugPanel.module.css';
import { DebugInfo } from '../app';
import { Signal } from '@preact/signals';
import { H } from './h';

type Props = {
    debugInfo: Signal<DebugInfo>;
};

export const DebugPanel:FunctionComponent<{ debugInfo: Signal<DebugInfo> }> = ({debugInfo}) => {
    const { drawn, culled, queue, chunks, meshes, player } = debugInfo.value;
    const [renderHalfResolution, setRenderHalfResolution] = useState(false);
    const toggleRenderHalfResolution = useCallback(() => {
        setRenderHalfResolution(!renderHalfResolution);
        window.wolkenwelten.render.renderSizeMultiplier = renderHalfResolution ? 1 : 0.5;
        window.wolkenwelten.render.resize();
    }, [renderHalfResolution]);

    return <div className={ styles.panel }>
        <H>Debug Panel</H>
        <table className={ styles.table }>
            <tr>
                <th>Chunks drawn</th>
                <td colSpan={3}>{ drawn }</td>
            </tr>
            <tr>
                <th>Chunks culled</th>
                <td colSpan={3}>{ culled }</td>
            </tr>
            <tr>
                <th>Queue length</th>
                <td colSpan={3}>{ queue }</td>
            </tr>
            <tr>
                <th>Chunk count</th>
                <td colSpan={3}>{ chunks }</td>
            </tr>
            <tr>
                <th>VoxelMesh count</th>
                <td colSpan={3}>{ meshes }</td>
            </tr>
            <tr>
                <th>Player position</th>
                <td>{ player.x.toFixed(1) }</td>
                <td>{ player.y.toFixed(1) }</td>
                <td>{ player.z.toFixed(1) }</td>
            </tr>
            <tr>
                <th>Player velocity</th>
                <td>{ player.vx.toFixed(3) }</td>
                <td>{ player.vy.toFixed(3) }</td>
                <td>{ player.vz.toFixed(3) }</td>
            </tr>
        </table>
        <label>Render at half-resolution: <input type="checkbox" checked={ renderHalfResolution } onChange={ toggleRenderHalfResolution }></input></label>
    </div>;
};
