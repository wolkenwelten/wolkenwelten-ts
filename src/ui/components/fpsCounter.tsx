import { h, FunctionComponent } from 'preact';
import styles from './fpsCounter.module.css';
import { Signal } from "@preact/signals";
import { H } from './h';

export const FpsCounter:FunctionComponent<{fps: Signal<number>}> = ({fps}) => (
    <div className={ styles.fps }>
        <H>FPS: {fps.value}</H>
    </div>
);
