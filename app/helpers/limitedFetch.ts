type Task<T> = () => Promise<T>;

function createLimiter(maxConcurrent: number) {
	let active = 0;
	const waiting: Array<() => void> = [];

	return function limit<T>(task: Task<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const run = () => {
				active += 1;
				task()
					.then(resolve, reject)
					.finally(() => {
						active -= 1;
						const next = waiting.shift();
						if (next) next();
					});
			};

			if (active < maxConcurrent) {
				run();
			} else {
				waiting.push(run);
			}
		});
	};
}

// Browsers open about 6 connections per host. Calls past that wait in the browser queue while PhyloPic's 3s timeout is already running.
export const limitGbif = createLimiter(6);
export const limitPhyloPic = createLimiter(6);
