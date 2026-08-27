"use client";
import React from "react";

// Note: Previously this component rendered a curved helix with nucleotide circles.
// The new design is intentionally simplified to straight parallel lines, with a
// short, blinking segment indicating the primer region.

const COLUMN_CONFIG = [
	{ offset: 2, bondHeight: 2 },
	{ offset: 1, bondHeight: 3 },
	{ offset: 0, bondHeight: 4 },
	{ offset: 1, bondHeight: 3 },
	{ offset: 2, bondHeight: 2 }
];

const generateHelixData = (topSeq: string, bottomSeq: string): any[] => {
	const columns = [];
	const seqLength = Math.max(topSeq?.length || 0, bottomSeq?.length || 0);

	for (let i = 0; i < seqLength; i++) {
		const topBase = topSeq?.[i] || " ";
		const bottomBase = bottomSeq?.[i] || " ";

		const config = COLUMN_CONFIG[i % COLUMN_CONFIG.length]!;
		columns.push({
			topBase,
			bottomBase,
			offset: config.offset,
			bondHeight: config.bondHeight,
			key: `${topBase}-${bottomBase}-${i}`
		});
	}
	return columns;
};

const Helix = ({
	data,
	primerStrand,
	primerStartIndex,
	primerEndIndex,
	primerBlinks,
	primerColor,
	scale,
	primerSequence
}: {
	data: any[];
	primerStrand: "top" | "bottom";
	primerStartIndex: number;
	primerEndIndex: number;
	primerBlinks: boolean;
	primerColor: string;
	scale?: number;
	// Optional: letters to draw along the primer segment (in display order)
	primerSequence?: string;
}) => {
	if (!data || data.length === 0) return null;

	// Compact sizing that automatically shrinks for very long sequences
	const totalColumns = data.length;
	const baseScale = typeof scale === "number" ? scale : 1;
	const lengthScale = totalColumns > 80 ? 80 / totalColumns : 1;
	const s = baseScale * Math.max(0.4, lengthScale);
	const unitWidth = 18 * s; // width per base (slightly larger)
	const padding = 16 * s;
	const topY = 22 * s;
	const bottomY = 60 * s;
	const strokeWidth = 7 * s;

	const width = totalColumns * unitWidth + padding * 2;
	// Extra bottom room so bottom sequence letters never clip
	const height = bottomY + padding + 24 * s;

	const getStrandClasses = (color: string, blink: boolean) => {
		let colorClass;
		switch (color) {
			case "primary":
				colorClass = "stroke-primary";
				break;
			case "secondary":
				colorClass = "stroke-secondary";
				break;
			case "base-content":
				colorClass = "stroke-base-content/40";
				break;
			default:
				colorClass = "stroke-transparent";
		}
		return `${colorClass} ${blink ? "animate-pulse" : ""}`;
	};

	const isPrimerTop = primerStrand === "top";

	const xFromIndex = (idx: number) => padding + idx * unitWidth;

	const primerX1 = xFromIndex(primerStartIndex);
	const primerX2 = xFromIndex(primerEndIndex);

	const lineY = (strand: "top" | "bottom") => (strand === "top" ? topY : bottomY);

	return (
		<svg width={width} height={height} className="font-mono">
			{/* Only draw the template/backbone line for the opposite strand */}
			{isPrimerTop ? (
				<line
					x1={padding}
					y1={bottomY}
					x2={width - padding}
					y2={bottomY}
					className={getStrandClasses("base-content", false)}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
				/>
			) : (
				<line
					x1={padding}
					y1={topY}
					x2={width - padding}
					y2={topY}
					className={getStrandClasses("base-content", false)}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
				/>
			)}

			{/* Uniform connector ticks: full-length on template strand, only within primer range on primer strand */}
			{Array.from({ length: totalColumns }).map((_, i) => {
				const x = xFromIndex(i) + unitWidth / 2;
				const connectorHeight = 12 * s;
				const drawTopTick = !isPrimerTop; // top is template when primer is bottom
				const drawBottomTick = isPrimerTop; // bottom is template when primer is top

				const ticks: React.ReactElement[] = [];
				if (drawTopTick) {
					const y1 = topY + strokeWidth / 2;
					const y2 = y1 + connectorHeight;
					ticks.push(
						<line key={`tt-${i}`} x1={x} y1={y1} x2={x} y2={y2} className="stroke-base-content/40" strokeWidth={2} />
					);
				}
				if (drawBottomTick) {
					const y2 = bottomY - strokeWidth / 2;
					const y1 = y2 - connectorHeight;
					ticks.push(
						<line key={`bt-${i}`} x1={x} y1={y1} x2={x} y2={y2} className="stroke-base-content/40" strokeWidth={2} />
					);
				}
				return <g key={`g-${i}`}>{ticks}</g>;
			})}

			{/* Primer segment line (no trailing grey on this strand) */}
			<line
				x1={primerX1}
				y1={lineY(isPrimerTop ? "top" : "bottom")}
				x2={primerX2}
				y2={lineY(isPrimerTop ? "top" : "bottom")}
				className={getStrandClasses(primerColor, false)}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
			/>
			{primerBlinks && (
				<line
					x1={primerX1}
					y1={lineY(isPrimerTop ? "top" : "bottom")}
					x2={primerX2}
					y2={lineY(isPrimerTop ? "top" : "bottom")}
					className={getStrandClasses(primerColor, true)}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
				/>
			)}

			{/* Primer-range ticks on the primer strand in primary color (same length/width) */}
			{Array.from({ length: Math.max(0, primerEndIndex - primerStartIndex) }).map((_, i) => {
				const idx = primerStartIndex + i;
				const x = xFromIndex(idx) + unitWidth / 2;
				const connectorHeight = 12 * s;
				if (isPrimerTop) {
					const y1 = topY + strokeWidth / 2;
					const y2 = y1 + connectorHeight;
					return <line key={`pt-${i}`} x1={x} y1={y1} x2={x} y2={y2} className="stroke-primary" strokeWidth={2} />;
				} else {
					const y2 = bottomY - strokeWidth / 2;
					const y1 = y2 - connectorHeight;
					return <line key={`pb-${i}`} x1={x} y1={y1} x2={x} y2={y2} className="stroke-primary" strokeWidth={2} />;
				}
			})}

			{/* Per-base letters along the primer segment */}
			{primerSequence &&
				Array.from(primerSequence).map((base, i) => {
					const x = xFromIndex(primerStartIndex + i) + unitWidth / 2;
					const y = isPrimerTop ? topY - 10 * (scale || 1) : bottomY + 22 * (scale || 1);
					return (
						<text
							key={`b-${i}`}
							x={x}
							y={y}
							textAnchor="middle"
							className="fill-primary"
							fontSize={14 * (scale || 1)}
							fontWeight="bold"
						>
							{base}
						</text>
					);
				})}
		</svg>
	);
};

// Helper to reverse a string, for reading 5' to 3' direction
const reverse = (str: string): string => str.split("").reverse().join("");

// Helper to get the complement of a DNA sequence
const dnaComplement = (dna: string): string => {
	const complements: { [key: string]: string } = {
		A: "T",
		T: "A",
		C: "G",
		G: "C",
		N: "N",
		R: "Y",
		Y: "R",
		S: "S",
		W: "W",
		K: "M",
		M: "K",
		B: "V",
		V: "B",
		D: "H",
		H: "D"
	};
	return dna
		.toUpperCase()
		.split("")
		.map((base) => complements[base] || "N")
		.join("");
};

// Helper component to render references as links if they start with https
const ReferenceLink = ({ reference }: { reference: string | null | undefined }) => {
	if (!reference) return <span>missing: not provided</span>;

	if (reference.startsWith("https")) {
		return (
			<a
				href={reference}
				target="_blank"
				rel="noopener noreferrer"
				className="text-primary hover:text-primary-focus underline"
			>
				{reference}
			</a>
		);
	}

	return <span>{reference}</span>;
};

const PrimerDiagram = ({
	forwardPrimerSequence,
	reversePrimerSequence,
	forwardPrimerName,
	reversePrimerName,
	forwardPrimerReference,
	reversePrimerReference,
	scale,
	showInfo = true,
	primerToDisplay
}: {
	forwardPrimerSequence: string;
	reversePrimerSequence: string;
	forwardPrimerName?: string;
	reversePrimerName?: string;
	forwardPrimerReference?: string | null;
	reversePrimerReference?: string | null;
	// Optional: scale the simplified straight-line rendering
	scale?: number;
	// Hide header/sequence/reference blocks; show only the visual diagrams
	showInfo?: boolean;
	// If true, render forward primer visuals first (on top)
	primerToDisplay: "forward" | "reverse";
}) => {
	const calculateGcContent = (seq: string) => {
		if (!seq || seq.length === 0) return "0.0";

		let gcCount = 0;
		let totalBases = seq.length;

		for (const base of seq.toUpperCase()) {
			switch (base) {
				case "G":
				case "C":
				case "S":
					gcCount += 1;
					break;
				case "V":
				case "B":
					gcCount += 2 / 3;
					break;
				case "R":
				case "Y":
				case "M":
				case "K":
					gcCount += 0.5;
					break;
				case "D":
				case "H":
					gcCount += 1 / 3;
					break;
				case "N":
					totalBases--;
					break;
			}
		}

		if (totalBases === 0) return "0.0";

		return ((gcCount / totalBases) * 100).toFixed(1);
	};

	const overhangLength = 5;

	// Reverse Primer Data (now rendered with backwards sequence to mirror forward)
	const reversePrimer_primer = reverse(reversePrimerSequence);
	const reversePrimer_template_paired = reverse(dnaComplement(reversePrimerSequence));
	const reversePairedData = generateHelixData(reversePrimer_template_paired, reversePrimer_primer);
	const reverseUnpairedData = generateHelixData("?".repeat(overhangLength), " ".repeat(overhangLength));
	const reversePrimerRenderProps = {
		data: [...reverseUnpairedData, ...reversePairedData],
		primerStrand: "bottom" as const,
		primerStartIndex: reverseUnpairedData.length,
		primerEndIndex: reverseUnpairedData.length + reversePairedData.length,
		primerBlinks: true,
		primerColor: "primary",
		templateColor: "base-content",
		scale,
		primerSequence: reversePrimer_primer
	};

	// Forward Primer Data (read in the forward direction; no reversing)
	const forwardPrimer_primer = forwardPrimerSequence;
	const forwardPrimer_template_paired = dnaComplement(forwardPrimerSequence);
	const forwardPairedData = generateHelixData(forwardPrimer_primer, forwardPrimer_template_paired);
	const forwardUnpairedData = generateHelixData(" ".repeat(overhangLength), "?".repeat(overhangLength));
	const forwardPrimerRenderProps = {
		data: [...forwardPairedData, ...forwardUnpairedData],
		primerStrand: "top" as const,
		primerStartIndex: 0,
		primerEndIndex: forwardPairedData.length,
		primerBlinks: true,
		primerColor: "primary",
		templateColor: "base-content",
		scale,
		primerSequence: forwardPrimer_primer
	};

	const ReverseSection = (
		<div className="flex flex-col">
			{showInfo && (
				<div className="text-center mb-4">
					<div className="flex items-baseline gap-2 justify-center">
						<p className="text-sm text-base-content">pcr_primer_name_reverse:</p>
						<h3 className="text-2xl font-bold text-primary">{reversePrimerName || "Reverse Primer"}</h3>
					</div>
					<p className="text-lg text-base-content">Sequence: {reversePrimerSequence}</p>
					<div className="text-sm text-base-content mt-1 space-y-1 mb-4">
						<p>
							Reference: <ReferenceLink reference={reversePrimerReference} />
						</p>
						<p>Length: {reversePrimerSequence.length}</p>
						<p>% GC: {calculateGcContent(reversePrimerSequence)}%</p>
					</div>
				</div>
			)}
			<div className="text-md leading-relaxed text-base-content flex flex-col items-center">
				<div className="flex justify-between w-full">
					<span>5&apos;</span>
					<span>3&apos;</span>
				</div>
				<div className="flex items-center -my-1 w-full overflow-x-auto justify-center">
					<Helix {...reversePrimerRenderProps} />
				</div>
				<div className="flex justify-between w-full">
					<span>3&apos;</span>
					<span>5&apos;</span>
				</div>
			</div>
		</div>
	);

	const ForwardSection = (
		<div className="flex flex-col">
			{showInfo && (
				<div className="text-center mb-4">
					<div className="flex items-baseline gap-2 justify-center">
						<p className="text-sm text-base-content">pcr_primer_name_forward:</p>
						<h3 className="text-2xl font-bold text-primary">{forwardPrimerName || "Forward Primer"}</h3>
					</div>
					<p className="text-lg text-base-content">Sequence: {forwardPrimerSequence}</p>
					<div className="text-sm text-base-content mt-1 space-y-1 mb-4">
						<p>
							Reference: <ReferenceLink reference={forwardPrimerReference} />
						</p>
						<p>Length: {forwardPrimerSequence.length}</p>
						<p>% GC: {calculateGcContent(forwardPrimerSequence)}%</p>
					</div>
				</div>
			)}
			<div className="text-md leading-relaxed text-base-content flex flex-col items-center">
				<div className="flex justify-between w-full">
					<span>5&apos;</span>
					<span>3&apos;</span>
				</div>
				<div className="flex items-center -my-1 w-full overflow-x-auto justify-center">
					<Helix {...forwardPrimerRenderProps} />
				</div>
				<div className="flex justify-between w-full">
					<span>3&apos;</span>
					<span>5&apos;</span>
				</div>
			</div>
		</div>
	);

	if (primerToDisplay === "forward") {
		return ForwardSection;
	}
	return ReverseSection;
};

export default PrimerDiagram;
/*
================================================================================
LEGACY (COMMENTED-OUT) CURVED HELIX IMPLEMENTATION
--------------------------------------------------------------------------------
We previously rendered a smoothed, curved double helix with nucleotide circles
for each base and vertical bonds between paired bases. The new design uses
straight parallel lines with a blinking primer segment. If you want to revert
to the older look, this block preserves the key logic and markup as reference.

Key pieces retained here:
- controlPoint + svgPath for cubic Bezier smoothing
- variable column offsets + bond heights to create the helix undulation
- circles with base letters and vertical pairing/bond lines

This code is intentionally commented out to keep the file single-sourced. Copy
sections back into the live component if you need to restore the old diagram.

// Helper functions for SVG path generation
const controlPoint = (current: number[], previous: number[] | undefined, next: number[] | undefined, reverse?: boolean): number[] => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.2;
    const o = {
        length: Math.sqrt(Math.pow(n[0] - p[0], 2) + Math.pow(n[1] - p[1], 2)),
        angle: Math.atan2(n[1] - p[1], n[0] - p[0])
    };
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;
    const x = current[0] + Math.cos(angle) * length;
    const y = current[1] + Math.sin(angle) * length;
    return [x, y];
};

const svgPath = (points: number[][]): string => {
    if (points.length === 0) return "";
    return points.reduce((acc, point, i, a) => {
        if (i === 0) return `M ${point[0]},${point[1]}`;
        const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
        const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
        return `${acc} C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
    }, '');
};

const COLUMN_CONFIG = [
    { offset: 2, bondHeight: 2 },
    { offset: 1, bondHeight: 3 },
    { offset: 0, bondHeight: 4 },
    { offset: 1, bondHeight: 3 },
    { offset: 2, bondHeight: 2 },
];

// In the old rendering, we computed variable Y positions for a top and bottom
// backbone using COLUMN_CONFIG to produce a wavy helix. We then:
// - Drew smoothed paths for both backbones (topPath/bottomPath)
// - Drew vertical bond lines for paired positions
// - Rendered circles at each base with a letter label
// - Overlaid a blinking path segment where the primer bound

================================================================================
*/
