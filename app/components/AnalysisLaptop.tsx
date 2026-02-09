"use client";

import { useState, useEffect, useRef } from "react";
import LaptopScreen, { type LaptopScreenBounds } from "@/app/components/LaptopScreen";

// Terminal commands that cycle through
const terminalSequences = [
	{
		command: "dada2 denoise-paired",
		lines: [
			"Loading FASTQ files...",
			"Filtering reads: quality > Q30",
			"Learning error rates...",
			"Denoising forward reads...",
			"Denoising reverse reads...",
			"Merging paired-end reads...",
			"Removing chimeras...",
			"ASVs generated: 2,847",
			"✓ Complete"
		]
	},
	{
		command: "vsearch --uchime_denovo",
		lines: [
			"Reading sequences...",
			"Sorting by abundance...",
			"Detecting chimeras...",
			"Chimeras found: 142",
			"Writing non-chimeric...",
			"✓ Complete"
		]
	},
	{
		command: "blastn -db nt -query asvs.fasta",
		lines: [
			"Connecting to NCBI...",
			"Query: 2,847 sequences",
			"Searching nucleotide DB...",
			"Processing hits...",
			"Matches found: 2,651",
			"Writing output...",
			"✓ Complete"
		]
	}
];

interface AnalysisLaptopProps {
	className?: string;
	screenBounds?: LaptopScreenBounds;
}

export default function AnalysisLaptop({ className, screenBounds }: AnalysisLaptopProps) {
	const [sequenceIndex, setSequenceIndex] = useState(0);
	const [visibleLines, setVisibleLines] = useState<string[]>([]);
	const [currentLineIndex, setCurrentLineIndex] = useState(0);
	const [isTyping, setIsTyping] = useState(true);
	const [typedCommand, setTypedCommand] = useState("");
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const currentSequence = terminalSequences[sequenceIndex];

	// Type out the command character by character
	useEffect(() => {
		if (!isTyping) return;

		const command = currentSequence.command;
		if (typedCommand.length < command.length) {
			timeoutRef.current = setTimeout(() => {
				setTypedCommand(command.slice(0, typedCommand.length + 1));
			}, 50);
		} else {
			// Command fully typed, start showing output lines
			timeoutRef.current = setTimeout(() => {
				setIsTyping(false);
				setCurrentLineIndex(0);
			}, 300);
		}

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [typedCommand, isTyping, currentSequence.command]);

	// Show output lines one by one
	useEffect(() => {
		if (isTyping) return;

		const lines = currentSequence.lines;
		if (currentLineIndex < lines.length) {
			timeoutRef.current = setTimeout(() => {
				setVisibleLines((prev) => [...prev, lines[currentLineIndex]]);
				setCurrentLineIndex((prev) => prev + 1);
			}, 400);
		} else {
			// All lines shown, wait then move to next sequence
			timeoutRef.current = setTimeout(() => {
				setSequenceIndex((prev) => (prev + 1) % terminalSequences.length);
				setVisibleLines([]);
				setTypedCommand("");
				setIsTyping(true);
				setCurrentLineIndex(0);
			}, 2500);
		}

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [currentLineIndex, isTyping, currentSequence.lines]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	return (
		<LaptopScreen className={className ?? ""} screenBounds={screenBounds} alt="Laptop showing bioinformatics analysis">
			<div className="w-full h-full bg-base-200 [html[data-theme='dark']_&]:bg-slate-800 rounded-sm overflow-hidden font-mono text-left p-2">
				{/* Terminal header */}
				<div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-base-300 [html[data-theme='dark']_&]:border-slate-600">
					<div className="w-2.5 h-2.5 rounded-full bg-red-400 [html[data-theme='dark']_&]:bg-red-500" />
					<div className="w-2.5 h-2.5 rounded-full bg-yellow-400 [html[data-theme='dark']_&]:bg-yellow-500" />
					<div className="w-2.5 h-2.5 rounded-full bg-green-400 [html[data-theme='dark']_&]:bg-green-500" />
					<span className="ml-2 text-base-content/50" style={{ fontSize: 10 }}>analysis.sh</span>
				</div>

				{/* Terminal content */}
				<div className="space-y-0.5 overflow-hidden" style={{ fontSize: 11 }}>
					{/* Command line */}
					<div className="flex items-center gap-1">
						<span className="text-success">$</span>
						<span className="text-base-content">{typedCommand}</span>
						{isTyping && <span className="animate-pulse text-base-content">▌</span>}
					</div>

					{/* Output lines */}
					{visibleLines.map((line, i) => (
						<div
							key={i}
							className={`${
								line.startsWith("✓") ? "text-success" : 
								line.includes("found:") || line.includes("generated:") || line.includes("Matches") ? "text-primary" : 
								"text-base-content/70"
							}`}
						>
							{line}
						</div>
					))}
				</div>
			</div>
		</LaptopScreen>
	);
}
