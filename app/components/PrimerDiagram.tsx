"use client";
import React from "react";

const ROW_CONFIG = [
	{ indent: 3, bondWidth: 1 },
	{ indent: 2, bondWidth: 3 },
	{ indent: 1, bondWidth: 5 },
	{ indent: 0, bondWidth: 7 },
	{ indent: 1, bondWidth: 5 },
	{ indent: 2, bondWidth: 3 },
	{ indent: 3, bondWidth: 1 },
];

const generateHelixData = (topSeq: string, bottomSeq: string): any[] => {
	const lines = [];
	const seqLength = Math.max(topSeq?.length || 0, bottomSeq?.length || 0);

	for (let i = 0; i < seqLength; i++) {
		const topBase = topSeq?.[i] || " ";
		const bottomBase = bottomSeq?.[i] || " ";

		const config = ROW_CONFIG[i % ROW_CONFIG.length];
		lines.push({
			topBase,
			bottomBase,
			indent: config.indent,
			bondWidth: config.bondWidth,
			key: `${topBase}-${bottomBase}-${i}`,
		});
	}
	return lines;
};

const Helix = ({ 
	data, 
	strand1Color, 
	strand2Color, 
	blinkStrand1 = false, 
	blinkStrand2 = false 
}: { 
	data: any[], 
	strand1Color: string, 
	strand2Color: string,
	blinkStrand1?: boolean,
	blinkStrand2?: boolean 
}) => {
	const isLeftStrandOnly = strand2Color.includes("transparent");
	const isRightStrandOnly = strand1Color.includes("transparent");
	const isPairedStrand = !isLeftStrandOnly && !isRightStrandOnly;

	return (
		<div>
			{data.map((row: any) => {
				const hasTopBase = row.topBase.trim() !== "";
				const hasBottomBase = row.bottomBase.trim() !== "";

				const showTopCircle = (isPairedStrand && hasTopBase) || isLeftStrandOnly;
				const showBottomCircle =
					(isPairedStrand && hasBottomBase) || isRightStrandOnly;

				return (
					<div
						key={row.key}
						className="flex items-center h-8"
						style={{ paddingLeft: `${row.indent * 0.5}rem` }}
					>
						{/* Left backbone piece */}
						<div className={`w-2 h-10 ${strand1Color} rounded-full -mr-1 z-10 ${
							blinkStrand1 ? 'animate-pulse' : ''
						}`} />

						{/* Top Base */}
						<div
							className={`z-20 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm border-2  ${
								showTopCircle
									? "bg-base-100 border-base-content/30"
									: "bg-transparent border-transparent"
							}`}
						>
							{row.topBase}
						</div>

						{/* Bond */}
						<div
							className={`h-px ${
								hasTopBase && hasBottomBase
									? "bg-base-content/30"
									: "bg-transparent"
							}`}
							style={{ width: `${row.bondWidth * 0.5}rem` }}
						/>

						{/* Bottom Base */}
						<div
							className={`z-20 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
								showBottomCircle
									? "bg-base-100 border-base-content/30"
									: "bg-transparent border-transparent"
							}`}
						>
							{row.bottomBase}
						</div>

						{/* Right backbone piece */}
						<div className={`w-2 h-10 ${strand2Color} rounded-full -ml-1 z-10 ${
							blinkStrand2 ? 'animate-pulse' : ''
						}`} />
					</div>
				);
			})}
		</div>
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

	// Reverse Primer: Binds to the template strand (top strand, typically 5' -> 3')
	const reversePrimer_primer = reversePrimerSequence;
	const reversePrimer_template_paired = dnaComplement(reversePrimerSequence);
	const reversePrimerPairedPart = generateHelixData(
		reversePrimer_template_paired,
		reversePrimer_primer
	);
	const templateUnpairedPart = generateHelixData(
		" ".repeat(overhangLength),
		" ".repeat(overhangLength)
	);

	// Forward Primer: Binds to the complementary strand (bottom strand, typically 3' -> 5')
	const forwardPrimer_primer = reverse(forwardPrimerSequence);
	const forwardPrimer_template_paired = reverse(dnaComplement(forwardPrimerSequence));
	const forwardPrimerPairedPart = generateHelixData(
		forwardPrimer_primer,
		forwardPrimer_template_paired
	);
	const complementaryUnpairedPart = generateHelixData(
		" ".repeat(overhangLength),
		" ".repeat(overhangLength)
	);

	return (
		<div className="space-y-4">
			<div className="p-6 bg-base-200 rounded-lg w-full flex flex-col md:flex-row gap-8 overflow-x-auto items-start">
				{/* Part 1: Reverse Primer */}
				<div className="flex-1 flex flex-col">
					<div className="text-center mb-4 min-h-[8rem] flex flex-col justify-center items-center">
						<div className="flex items-baseline gap-2">
							<p className="text-sm text-base-content">pcr_primer_name_reverse:</p>
							<h3 className="text-2xl font-bold text-primary">
								{reversePrimerName || "Reverse Primer"}
							</h3>
						</div>
						<p className="text-lg text-base-content">Sequence: {reversePrimerSequence}</p>
						<div className="text-sm text-base-content mt-1 space-y-1 mb-4">
							<p>Reference: {reversePrimerReference || "missing: not provided"}</p>
							<p>Length: {reversePrimerSequence.length}</p>
							<p>% GC: {calculateGcContent(reversePrimerSequence)}%</p>
						</div>
					</div>
					<div className="text-md leading-relaxed text-base-content flex justify-center">
						{/* Left Strand (Template) Labels */}
						<div className="flex flex-col justify-between">
							<span>3'</span>
							<span>5'</span>
						</div>

						{/* Helix */}
						<div className="flex flex-col items-center mx-2">
							<Helix 
								data={reversePrimerPairedPart} 
								strand1Color="bg-secondary" 
								strand2Color="bg-primary"
								blinkStrand1={false}
								blinkStrand2={true}
							/>
							<Helix 
								data={templateUnpairedPart} 
								strand1Color="bg-secondary" 
								strand2Color="bg-transparent"
								blinkStrand1={false}
								blinkStrand2={false}
							/>
						</div>

						{/* Right Strand (Primer) Labels */}
						<div className="flex flex-col">
							<div className="flex flex-col justify-between" style={{ minHeight: `${reversePrimerPairedPart.length * 2}rem` }}>
								<span>5'</span>
								<span>3'</span>
							</div>
						</div>
					</div>
				</div>

				{/* Divider */}
				<div className="border-l border-base-content/20 self-stretch"></div>

				{/* Part 2: Forward Primer */}
				<div className="flex-1 flex flex-col">
					<div className="text-center mb-4 min-h-[8rem] flex flex-col justify-center items-center">
						<div className="flex items-baseline gap-2">
							<p className="text-sm text-base-content">pcr_primer_name_forward:</p>
							<h3 className="text-2xl font-bold text-primary">
								{forwardPrimerName || "Forward Primer"}
							</h3>
						</div>
						<p className="text-lg text-base-content">Sequence: {forwardPrimerSequence}</p>
						<div className="text-sm text-base-content mt-1 space-y-1 mb-4">
							<p>Reference: {forwardPrimerReference || "missing: not provided"}</p>
							<p>Length: {forwardPrimerSequence.length}</p>
							<p>% GC: {calculateGcContent(forwardPrimerSequence)}%</p>
						</div>
					</div>
					<div className="text-md leading-relaxed text-base-content flex justify-center">
						{/* Left Strand (Primer) Labels */}
						<div className="flex flex-col justify-end">
							<div className="flex flex-col justify-between" style={{ minHeight: `${forwardPrimerPairedPart.length * 2}rem` }}>
								<span>3'</span>
								<span>5'</span>
							</div>
						</div>

						{/* Helix */}
						<div className="flex flex-col items-center mx-2">
							<Helix 
								data={complementaryUnpairedPart} 
								strand1Color="bg-transparent" 
								strand2Color="bg-secondary"
								blinkStrand1={false}
								blinkStrand2={false}
							/>
							<Helix 
								data={forwardPrimerPairedPart} 
								strand1Color="bg-primary" 
								strand2Color="bg-secondary"
								blinkStrand1={true}
								blinkStrand2={false}
							/>
						</div>

						{/* Right Strand (Complementary) Labels */}
						<div className="flex flex-col justify-between">
							<span>5'</span>
							<span>3'</span>
						</div>
					</div>
				</div>
			</div>
			
			{/* Legend */}
			<div className="p-4 bg-base-100 rounded-lg border border-base-content/10">
				<h4 className="font-semibold text-base-content mb-2">Legend:</h4>
				<div className="space-y-2 text-sm">
					<div className="flex items-center gap-2">
						<div className="w-4 h-2 bg-primary rounded animate-pulse"></div>
						<span>Actual primer sequence (blinking)</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-2 bg-secondary rounded"></div>
						<span>Template/complementary strand</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PrimerDiagram;
