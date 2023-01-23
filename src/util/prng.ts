export class LCG {
    seed: number;

    static calc(x: number) {
        return (1664525 * x + 1013904223) % 4294967296;
    }

    constructor(seed: number | string | number[]) {
        if (typeof seed === 'number') {
            this.seed = seed;
        } else if (Array.isArray(seed)) {
            this.seed = 2345;
            for (let i = 0; i < seed.length; i++) {
                this.seed ^= LCG.calc(seed[i]);
                this.generate();
            }
        } else {
            this.seed = 1234;
            for (let i = 0; i < seed.length; i++) {
                this.seed ^= LCG.calc(seed.charCodeAt(i));
                this.generate();
            }
        }
    }

    floatNOneToOne() {
        return this.float() * 2.0 - 1.0;
    }

    float() {
        return this.generate() / 4294967296;
    }

    int(min = 0, max = Number.MAX_SAFE_INTEGER) {
        return (this.generate() % (max - min)) + min;
    }

    bool(chanceOneTo = 2) {
        return this.int(0, chanceOneTo) === 0;
    }

    generate() {
        return (this.seed = LCG.calc(this.seed));
    }
}
