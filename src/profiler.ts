/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
export interface ProfilingResults {
	id: string;
	i: number;
	results: Float32Array;
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
				i: 0,
				results: new Float32Array(1024),
			};
			this.profiles.set(id, res);
		}
		res.results[res.i] = stop - start;
		res.i = (res.i + 1) % res.results.length;
	}

	addAmount(id: string, n: number) {
		this.add(id, 0, n);
	}

	showResults() {
		const tmp: any = {};
		for (const prof of this.profiles.values()) {
			const results: number[] = []; // First we move the results out of the ring buffer
			for (let i = 0; i < prof.results.length; i++) {
				const v = prof.results[i];
				if (v > 0) {
					results.push(v);
				}
			}

			const average = results.reduceRight((a, b) => a + b, 0) / results.length;
			const sorted = results.sort((a, b) => a - b);
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
