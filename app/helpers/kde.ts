/** Gaussian kernel density estimate. Returns points across a fixed grid spanning the data's range. */
export function gaussianKDE(values: number[], gridPoints = 40) {
	if (values.length === 0) {
		return { x: [] as number[], y: [] as number[] };
	}

	const n = values.length;
	const mean = values.reduce((a, b) => a + b, 0) / n;
	const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(n - 1, 1);
	const stdev = Math.sqrt(variance) || 1;

	// Silverman's rule of thumb
	const bandwidth = 1.06 * stdev * Math.pow(n, -1 / 5) || 1;

	const min = Math.min(...values);
	const max = Math.max(...values);
	const padding = (max - min) * 0.1 || 1;
	const gridMin = min - padding;
	const gridMax = max + padding;
	const step = (gridMax - gridMin) / (gridPoints - 1);

	const x: number[] = [];
	const y: number[] = [];

	for (let i = 0; i < gridPoints; i++) {
		const xi = gridMin + i * step;
		let density = 0;
		for (const v of values) {
			const u = (xi - v) / bandwidth;
			density += Math.exp(-0.5 * u * u);
		}
		density /= n * bandwidth * Math.sqrt(2 * Math.PI);

		x.push(xi);
		y.push(density);
	}

	return { x, y };
}
