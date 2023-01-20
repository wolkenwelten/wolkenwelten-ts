import { mat4, vec4 } from 'gl-matrix';

export class Frustum {
    planes: vec4[];

    constructor(projection: mat4, view: mat4) {
        const clip = mat4.create();
        mat4.multiply(clip, projection, view);

        const rows = [
            vec4.fromValues(clip[0], clip[4], clip[8], clip[12]),
            vec4.fromValues(clip[1], clip[5], clip[9], clip[13]),
            vec4.fromValues(clip[2], clip[6], clip[10], clip[14]),
            vec4.fromValues(clip[3], clip[7], clip[11], clip[15]),
        ];
        const right = vec4.sub(vec4.create(), rows[3], rows[0]);
        const left = vec4.add(vec4.create(), rows[3], rows[0]);
        const top = vec4.sub(vec4.create(), rows[3], rows[1]);
        const bottom = vec4.add(vec4.create(), rows[3], rows[1]);
        const far = vec4.sub(vec4.create(), rows[3], rows[2]);
        const near = vec4.add(vec4.create(), rows[3], rows[2]);
        this.planes = [right, left, top, bottom, far, near];
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
        planeLoop: for (const plane of this.planes) {
            for (let x = 0; x < 2; x++) {
                for (let y = 0; y < 2; y++) {
                    for (let z = 0; z < 2; z++) {
                        const cp = vec4.fromValues(
                            p[0] + 32 * x,
                            p[1] + 32 * y,
                            p[2] + 32 * z,
                            1
                        );
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
