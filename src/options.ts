/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { isClient } from './util/compat';

export class Options {
    skipMenu = false;
    startWithEquipment = false;

    private parseBoolean(def: boolean, paramValue: string | null): boolean {
        if (paramValue === null) {
            return def;
        }
        switch (paramValue.trim().toLowerCase()) {
            case '1':
            case 'on':
            case 'true':
                return true;
            case '0':
            case 'off':
            case 'false':
                return false;
        }
        return def;
    }

    /*
    private parseNumber(def: number, paramValue: string | null) {
        if (paramValue === null) {
            return def;
        }
        const v = parseInt(paramValue);
        return v !== undefined ? v : def;
    }
    */

    constructor() {
        if (isClient()) {
            const params = new URLSearchParams(window.location.search);
            this.skipMenu = window.location.hostname === 'localhost';
            this.skipMenu = this.parseBoolean(
                this.skipMenu,
                params.get('skipMenu')
            );
            this.startWithEquipment = this.parseBoolean(
                this.startWithEquipment,
                params.get('startWithEquipment')
            );
        } else {
            this.skipMenu = true;
        }
    }
}

const options = new Options();
export default options;
