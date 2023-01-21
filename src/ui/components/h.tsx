import { h, ComponentChildren } from 'preact';
import styles from './h.module.css';

type Props = {
    children: ComponentChildren;
};

export const H = ({children}: Props) => (
    <div className={ styles.h }>
        {children}
    </div>
);
