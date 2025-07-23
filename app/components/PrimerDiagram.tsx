"use client";
import React from "react";

const COLUMN_CONFIG = [
	{ offset: 2, bondHeight: 2 },
	{ offset: 1, bondHeight: 4 },
	{ offset: 0, bondHeight: 6 },
	{ offset: 1, bondHeight: 4 },
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
	const isTopStrandOnly = strand2Color.includes("transparent");
	const isBottomStrandOnly = strand1Color.includes("transparent");
	const isPairedStrand = !isTopStrandOnly && !isBottomStrandOnly;

	return (
		<div className="flex">
			{data.map((column: any) => {
				const hasTopBase = column.topBase.trim() !== "";
				const hasBottomBase = column.bottomBase.trim() !== "";

				const showTopCircle = (isPairedStrand && hasTopBase) || isTopStrandOnly;
				const showBottomCircle =
					(isPairedStrand && hasBottomBase) || isBottomStrandOnly;

				return (
					<div
						key={column.key}
						className="flex flex-col items-center w-8"
						style={{ paddingTop: `${column.offset * 0.5}rem` }}
					>
						{/* Top backbone piece */}
						<div className={`h-2 w-10 ${strand1Color} rounded-full -mb-1 z-10 ${
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
							{column.topBase}
						</div>

						{/* Bond */}
						<div
							className={`w-px ${
								hasTopBase && hasBottomBase
									? "bg-base-content/30"
									: "bg-transparent"
							}`}
							style={{ height: `${column.bondHeight * 0.5}rem` }}
						/>

						{/* Bottom Base */}
						<div
							className={`z-20 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
								showBottomCircle
									? "bg-base-100 border-base-content/30"
									: "bg-transparent border-transparent"
							}`}
						>
							{column.bottomBase}
						</div>

						{/* Bottom backbone piece */}
						<div className={`h-2 w-10 ${strand2Color} rounded-full -mt-1 z-10 ${
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
