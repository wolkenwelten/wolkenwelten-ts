import { Game } from './game';

export interface ProfilingResults {
    id: string;
    results: number[];
}

export class ProfilingManager {
    profiles: Map<string, ProfilingResults> = new Map();

    static profiler() {
        return profiler;
    }

    add(id: string, start: number, stop: number) {
        let res = this.profiles.get(id);
        if (!res) {
            res = {
                id,
                results: [],
            };
            this.profiles.set(id, res);
        }
        res.results.push(stop - start);
    }

    addAmount(id: string, n: number) {
        this.add(id, 0, n);
    }

    showResults() {
        const tmp: any = {};
        for (const prof of this.profiles.values()) {
            const average =
                prof.results.reduceRight((a, b) => a + b, 0) /
                prof.results.length;
            const sorted = prof.results.sort((a, b) => a - b);
            const best = sorted[0];
            const median = sorted[Math.floor(sorted.length / 2)];
            const worst = sorted[sorted.length - 1];
            tmp[prof.id] = {
                Average: average,
                Best: best,
                Median: median,
                Worst: worst,
                Samples: sorted.length,
            };
        }
        console.table(tmp);
    }
}
const profiler = new ProfilingManager();
export default profiler;
