/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { Game } from '../../../game';
import { Div } from '../../utils';
import styles from './settingsWrap.module.css';

export class SettingsWrap {
    div: HTMLElement;
    game: Game;

    initViewDistance() {
        const wrap = Div({
            class: styles.radioButtonWrap,
            html: `<h4>View Distance</h4>
        <label class="${styles.radioButton}">
            <input type="radio" name="renderDistance" value="near"/>
            <span>Near</span>
        </label>
        <label class="${styles.radioButton}">
            <input type="radio" name="renderDistance" value="medium" checked/>
            <span>Medium</span>
        </label>
        <label class="${styles.radioButton}">
            <input type="radio" name="renderDistance" value="far"/>
            <span>Far</span>
        </label>`,
        });
        this.div.append(wrap);

        for (const e of wrap.querySelectorAll('input')) {
            e.addEventListener('change', this.onChange.bind(this));
        }
    }

    initVolume() {
        const that = this;
        const wrap = Div({
            class: styles.volumeWrap,
            html: `<h4>Volume</h4>
        <input type="range" name="volume" value="100" min="0" max="100" step="any"/>`,
        });
        const input = wrap.querySelector('input');
        input?.addEventListener('change', (e) => {
            that.game.audio.setVolume(parseInt(input.value) / 100.0);
        });
        this.div.append(wrap);
    }

    constructor(parent: HTMLElement, game: Game) {
        this.div = Div({ class: styles.settingsWrap });

        this.initViewDistance();
        this.initVolume();

        this.game = game;
        parent.appendChild(this.div);
    }

    update() {
        const rd = this.game.render.renderDistance;
        const v = rd < 150 ? 'near' : rd > 170 ? 'far' : 'medium';
        const inp = this.div.querySelector(
            `input[type="radio"][name="renderDistance"][value="${v}"]`
        ) as HTMLInputElement | null;
        if (inp) {
            inp.checked = true;
        }
    }

    onChange() {
        const renderDistance =
            this.div
                .querySelector(
                    `input[type="radio"][name="renderDistance"]:checked`
                )
                ?.getAttribute('value') || 'medium';
        let renderDist = 160;
        if (renderDistance === 'near') {
            renderDist = 96;
        } else if (renderDistance === 'far') {
            renderDist = 256;
        }
        this.game.render.renderDistance = renderDist;
    }
}
