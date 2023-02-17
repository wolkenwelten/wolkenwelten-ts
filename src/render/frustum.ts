/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { mat4, vec4 } from 'gl-matrix';

export class Frustum {
    clip: mat4;
    planes: vec4[];
    rows: vec4[];

    constructor() {
        this.clip = mat4.create();
        this.rows = [
            vec4.create(),
            vec4.create(),
            vec4.create(),
            vec4.create(),
        ];
        this.planes = [
            vec4.create(),
            vec4.create(),
            vec4.create(),
            vec4.create(),
            vec4.create(),
            vec4.create(),
        ];
    }

    build(projection: mat4, view: mat4) {
        const clip = this.clip;
        const rows = this.rows;
        const planes = this.planes;

        mat4.multiply(clip, projection, view);

        rows[0][0] = clip[0];
        rows[0][1] = clip[4];
        rows[0][2] = clip[8];
        rows[0][3] = clip[12];
        rows[1][0] = clip[1];
        rows[1][1] = clip[5];
        rows[1][2] = clip[9];
        rows[1][3] = clip[13];
        rows[2][0] = clip[2];
        rows[2][1] = clip[6];
        rows[2][2] = clip[10];
        rows[2][3] = clip[14];
        rows[3][0] = clip[3];
        rows[3][1] = clip[7];
        rows[3][2] = clip[11];
        rows[3][3] = clip[15];

        vec4.sub(planes[0], rows[3], rows[0]);
        vec4.add(planes[1], rows[3], rows[0]);
        vec4.sub(planes[2], rows[3], rows[1]);
        vec4.add(planes[3], rows[3], rows[1]);
        vec4.sub(planes[4], rows[3], rows[2]);
        vec4.add(planes[5], rows[3], rows[2]);
    }

    containsPoint(p: vec4) {
        for (const plane of this.planes) {
            if (vec4.dot(plane, p) > 0) {
                return false;
            }
        }
        return true;
    }

    containsCube(p: vec4) {
        const cp = vec4.create();
        planeLoop: for (const plane of this.planes) {
            for (let x = 0; x < 2; x++) {
                for (let y = 0; y < 2; y++) {
                    for (let z = 0; z < 2; z++) {
                        cp[0] = p[0] + 32 * x;
                        cp[1] = p[1] + 32 * y;
                        cp[2] = p[2] + 32 * z;
                        cp[3] = 1;
                        if (vec4.dot(plane, cp) > 0) {
                            continue planeLoop;
                        }
                    }
                }
            }
            return false;
        }
        return true;
    }
}
