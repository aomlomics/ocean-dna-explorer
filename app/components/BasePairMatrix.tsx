"use client";

import React, { useEffect, useState } from "react";

type Base = "A" | "C" | "T" | "G";

const BASES: Base[] = ["A", "C", "T", "G"];

function getRandomBase(): Base {
	return BASES[Math.floor(Math.random() * BASES.length)];
}

interface BasePairMatrixProps {
	rows?: number;
	columns?: number;
	className?: string;
}

/**
 * Animated grid of ACTG characters.
 * Random cells flip between bases on an interval to evoke a
 * "Matrix-style" data stream, but kept small and subtle so
 * it doesn't distract from surrounding content.
 */
const BasePairMatrix: React.FC<BasePairMatrixProps> = ({
	rows = 5,
	columns = 8,
	className
}) => {
	const [grid, setGrid] = useState<string[][]>(() =>
		Array.from({ length: rows }, () => Array.from({ length: columns }, getRandomBase))
	);

	useEffect(() => {
		const totalCells = rows * columns;
		const intervalMs = 160;

		const intervalId = window.setInterval(() => {
			setGrid((prev) => {
				const next = prev.map((row) => [...row]);

				// Flip a small random subset of cells each tick
				const flips = Math.max(1, Math.floor(totalCells * 0.15));
				for (let i = 0; i < flips; i += 1) {
					const r = Math.floor(Math.random() * rows);
					const c = Math.floor(Math.random() * columns);
					next[r][c] = getRandomBase();
				}

				return next;
			});
		}, intervalMs);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [rows, columns]);

	return (
		<div
			className={`flex flex-col gap-1 font-mono text-xs sm:text-sm tracking-[0.35em] text-primary/80 ${
				className ?? ""
			}`}
		>
			{grid.map((row, rowIndex) => (
				<div key={rowIndex}>{row.join("")}</div>
			))}
		</div>
	);
};

export default BasePairMatrix;

