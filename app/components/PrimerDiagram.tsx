"use client";
import React from "react";

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

const generateHelixData = (topSeq: string, bottomSeq: string): any[] => {
	const columns = [];
	const seqLength = Math.max(topSeq?.length || 0, bottomSeq?.length || 0);

	for (let i = 0; i < seqLength; i++) {
		const topBase = topSeq?.[i] || " ";
		const bottomBase = bottomSeq?.[i] || " ";

		const config = COLUMN_CONFIG[i % COLUMN_CONFIG.length];
		columns.push({
			topBase,
			bottomBase,
			offset: config.offset,
			bondHeight: config.bondHeight,
			key: `${topBase}-${bottomBase}-${i}`,
		});
	}
	return columns;
};

interface HelixProps {
	data: any[];
	primerStrand: 'top' | 'bottom';
	primerStartIndex: number;
	primerEndIndex: number;
	primerBlinks: boolean;
	primerColor: string;
	templateColor: string;
}

const Helix = ({
	data,
	primerStrand,
	primerStartIndex,
	primerEndIndex,
	primerBlinks,
	primerColor,
	templateColor,
}: HelixProps) => {
	if (!data || data.length === 0) return null;

	const columnWidth = 36;
	const baseRadius = 14;
	const offsetScale = 10;
	const bondHeightScale = 20; 
	const backboneStrokeWidth = 8;
	const baseStrokeWidth = 2;
	const baseFontSize = "14px";
	const verticalPadding = baseRadius;

	const points = data.map((col, i) => {
		const x = i * columnWidth + columnWidth / 2;
		const topY = col.offset * offsetScale + verticalPadding;
		const bottomY = topY + col.bondHeight * bondHeightScale + baseRadius;
		return { x, topY, bottomY };
	});

	const topBackbonePoints = points.map(p => [p.x, p.topY]);
	const bottomBackbonePoints = points.map(p => [p.x, p.bottomY]);

	const topPath = svgPath(topBackbonePoints);
	const bottomPath = svgPath(bottomBackbonePoints);

	const width = data.length * columnWidth;
	const height = Math.max(...points.map(p => p.bottomY)) + baseRadius + verticalPadding;

	const getStrandClasses = (color: string, blink: boolean) => {
		let colorClass;
		switch (color) {
			case 'primary': colorClass = 'stroke-primary'; break;
			case 'secondary': colorClass = 'stroke-secondary'; break;
			case 'base-content': colorClass = 'stroke-base-content/40'; break;
			default: colorClass = 'stroke-transparent';
		}
		return `${colorClass} ${blink ? 'animate-pulse' : ''}`;
	};

	const isPrimerTop = primerStrand === 'top';
	
	const topTemplateClasses = getStrandClasses(isPrimerTop ? templateColor : primerColor, isPrimerTop ? false : primerBlinks);
	const bottomTemplateClasses = getStrandClasses(isPrimerTop ? primerColor : templateColor, isPrimerTop ? primerBlinks : false);

	const topStrandIsTemplate = primerStrand === 'bottom';
	const bottomStrandIsTemplate = primerStrand === 'top';

	const topStrandColor = topStrandIsTemplate ? templateColor : primerColor;
	const bottomStrandColor = bottomStrandIsTemplate ? templateColor : primerColor;

	const topStrandBlinks = topStrandIsTemplate ? false : primerBlinks;
	const bottomStrandBlinks = bottomStrandIsTemplate ? false : primerBlinks;

	const topWholePath = svgPath(topBackbonePoints);
	const bottomWholePath = svgPath(bottomBackbonePoints);
	
	const primerPoints = (isPrimerTop ? topBackbonePoints : bottomBackbonePoints).slice(primerStartIndex, primerEndIndex);
	const primerPath = svgPath(primerPoints);
	const templatePath = isPrimerTop ? bottomWholePath : topWholePath;


	return (
		<svg width={width} height={height} className="font-mono">
			{/* Render Template Strand */}
			<path d={templatePath} fill="none" className={getStrandClasses(templateColor, false)} strokeWidth={backboneStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />
			
			{/* Render Primer Strand */}
			<path d={primerPath} fill="none" className={getStrandClasses(primerColor, false)} strokeWidth={backboneStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />
			
			{/* Overlay the blinking primer segment */}
			{primerBlinks && <path d={primerPath} fill="none" className={getStrandClasses(primerColor, true)} strokeWidth={backboneStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />}

			{data.map((col, i) => {
				const p = points[i];

				const hasTopBase = col.topBase.trim() !== "";
				const hasBottomBase = col.bottomBase.trim() !== "";

				const showTopCircle = hasTopBase;
				const showBottomCircle = hasBottomBase;

				const showPartialBondFromTop = showTopCircle && !showBottomCircle;
				const showPartialBondFromBottom = !showTopCircle && showBottomCircle;

				return (
					<g key={col.key}>
						{showTopCircle && showBottomCircle && (
							<line x1={p.x} y1={p.topY} x2={p.x} y2={p.bottomY} className="stroke-base-content/40" strokeWidth={baseStrokeWidth / 2} />
						)}

						{showPartialBondFromTop && (
							<line x1={p.x} y1={p.topY} x2={p.x} y2={p.topY + (p.bottomY - p.topY) / 3} className="stroke-base-content/40" strokeWidth={baseStrokeWidth / 2} />
						)}

						{showPartialBondFromBottom && (
							<line x1={p.x} y1={p.bottomY} x2={p.x} y2={p.bottomY - (p.bottomY - p.topY) / 3} className="stroke-base-content/40" strokeWidth={baseStrokeWidth / 2} />
						)}

						{showTopCircle && (
							<g>
								<circle cx={p.x} cy={p.topY} r={baseRadius} className="fill-base-100 stroke-base-content/40" strokeWidth={baseStrokeWidth} />
								<text x={p.x} y={p.topY} dy=".3em" textAnchor="middle" fontSize={baseFontSize} fontWeight="bold" className="fill-base-content select-none">
									{col.topBase}
								</text>
							</g>
						)}

						{showBottomCircle && (
							<g>
								<circle cx={p.x} cy={p.bottomY} r={baseRadius} className="fill-base-100 stroke-base-content/40" strokeWidth={baseStrokeWidth} />
								<text x={p.x} y={p.bottomY} dy=".3em" textAnchor="middle" fontSize={baseFontSize} fontWeight="bold" className="fill-base-content select-none">
									{col.bottomBase}
								</text>
							</g>
						)}
					</g>
				)
			})}
		</svg>
	);
};

// Helper to reverse a string, for reading 5' to 3' direction
const reverse = (str: string): string => str.split("").reverse().join("");

// Helper to get the complement of a DNA sequence
const dnaComplement = (dna: string): string => {
	const complements: { [key: string]: string } = {
		A: "T", T: "A", C: "G", G: "C", N: "N",
		R: "Y", Y: "R", S: "S", W: "W", K: "M", M: "K",
		B: "V", V: "B", D: "H", H: "D",
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


interface PrimerDiagramProps {
	forwardPrimerSequence: string;
	reversePrimerSequence: string;
	forwardPrimerName?: string;
	reversePrimerName?: string;
	forwardPrimerReference?: string | null;
	reversePrimerReference?: string | null;
}

const PrimerDiagram = ({
	forwardPrimerSequence,
	reversePrimerSequence,
	forwardPrimerName,
	reversePrimerName,
	forwardPrimerReference,
	reversePrimerReference,
}: PrimerDiagramProps) => {
	const calculateGcContent = (seq: string) => {
		if (!seq || seq.length === 0) return "0.0";
		const gcCount = (seq.toUpperCase().match(/[GC]/g) || []).length;
		return ((gcCount / seq.length) * 100).toFixed(1);
	};

	const overhangLength = 5;

	// Reverse Primer Data
	const reversePrimer_primer = reversePrimerSequence;
	const reversePrimer_template_paired = dnaComplement(reversePrimerSequence);
	const reversePairedData = generateHelixData(
		reversePrimer_template_paired,
		reversePrimer_primer
	);
	const reverseUnpairedData = generateHelixData(
		"?".repeat(overhangLength),
		" ".repeat(overhangLength)
	);
	const reversePrimerRenderProps = {
		data: [...reversePairedData, ...reverseUnpairedData],
		primerStrand: "bottom" as const,
		primerStartIndex: 0,
		primerEndIndex: reversePairedData.length,
		primerBlinks: true,
		primerColor: "primary",
		templateColor: "base-content",
	};

	// Forward Primer Data
	const forwardPrimer_primer = reverse(forwardPrimerSequence);
	const forwardPrimer_template_paired = reverse(dnaComplement(forwardPrimerSequence));
	const forwardPairedData = generateHelixData(
		forwardPrimer_primer,
		forwardPrimer_template_paired
	);
	const forwardUnpairedData = generateHelixData(
		" ".repeat(overhangLength),
		"?".repeat(overhangLength)
	);
	const forwardPrimerRenderProps = {
		data: [...forwardUnpairedData, ...forwardPairedData],
		primerStrand: "top" as const,
		primerStartIndex: forwardUnpairedData.length,
		primerEndIndex: forwardUnpairedData.length + forwardPairedData.length,
		primerBlinks: true,
		primerColor: "primary",
		templateColor: "base-content",
	};

	return (
		<div className="p-6 bg-base-200 rounded-lg w-full flex flex-col gap-8 overflow-x-auto">
			{/* Part 1: Reverse Primer */}
			<div className="flex flex-col">
				<div className="text-center mb-4">
					<div className="flex items-baseline gap-2 justify-center">
						<p className="text-sm text-base-content">pcr_primer_name_reverse:</p>
						<h3 className="text-2xl font-bold text-primary">
							{reversePrimerName || "Reverse Primer"}
						</h3>
					</div>
					<p className="text-lg text-base-content">Sequence: {reversePrimerSequence}</p>
					<div className="text-sm text-base-content mt-1 space-y-1 mb-4">
						<p>Reference: <ReferenceLink reference={reversePrimerReference} /></p>
						<p>Length: {reversePrimerSequence.length}</p>
						<p>% GC: {calculateGcContent(reversePrimerSequence)}%</p>
					</div>
				</div>
				<div className="text-md leading-relaxed text-base-content flex flex-col items-center">
					{/* Top Labels */}
					<div className="flex justify-between w-full mb-2">
						<span>3'</span>
						<span>5'</span>
					</div>

					{/* Helix */}
					<div className="flex items-center">
						<Helix {...reversePrimerRenderProps} />
					</div>

					{/* Bottom Labels */}
					<div className="flex justify-between w-full mt-2">
						<span>5'</span>
						<span>3'</span>
					</div>
				</div>
			</div>

			{/* Divider */}
			<div className="border-t border-base-content/20"></div>

			{/* Part 2: Forward Primer */}
			<div className="flex flex-col">
				<div className="text-md leading-relaxed text-base-content flex flex-col items-center">
					{/* Top Labels */}
					<div className="flex justify-between w-full mb-2">
						<span>3'</span>
						<span>5'</span>
					</div>

					{/* Helix */}
					<div className="flex items-center">
						<Helix {...forwardPrimerRenderProps} />
					</div>

					{/* Bottom Labels */}
					<div className="flex justify-between w-full mt-2">
						<span>5'</span>
						<span>3'</span>
					</div>
				</div>
				<div className="text-center mt-4">
					<div className="flex items-baseline gap-2 justify-center">
						<p className="text-sm text-base-content">pcr_primer_name_forward:</p>
						<h3 className="text-2xl font-bold text-primary">
							{forwardPrimerName || "Forward Primer"}
						</h3>
					</div>
					<p className="text-lg text-base-content">Sequence: {forwardPrimerSequence}</p>
					<div className="text-sm text-base-content mt-1 space-y-1 mb-4">
						<p>Reference: <ReferenceLink reference={forwardPrimerReference} /></p>
						<p>Length: {forwardPrimerSequence.length}</p>
						<p>% GC: {calculateGcContent(forwardPrimerSequence)}%</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PrimerDiagram;
