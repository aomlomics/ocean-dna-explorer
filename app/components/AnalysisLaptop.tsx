"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import LaptopScreen, { type LaptopScreenBounds } from "@/app/components/LaptopScreen";

// Terminal commands that cycle through
const terminalSequences = [
	{
		command: "dada2 denoise-paired",
		lines: [
			"[info] Loading FASTQ files: 96 samples",
			"[info] Trimming primers + adapters",
			"[info] Filtering reads (Q ≥ 30, maxEE ≤ 2)",
			"[info] Reads retained: 18,402,119 / 20,117,884",
			"[step] Learning error rates (forward)",
			"[step] Learning error rates (reverse)",
			"[step] Denoising forward reads…",
			"[step] Denoising reverse reads…",
			"[step] Merging paired-end reads…",
			"[step] Removing chimeras (consensus)…",
			"[info] ASVs generated: 2,847",
			"[info] Mean read length: 253 bp",
			"[info] Per-sample ASV median: 2,104",
			"[done] ✓ Complete"
		]
	},
	{
		command: "vsearch --uchime_denovo",
		lines: [
			"[info] Reading sequences (ASVs)…",
			"[info] Sorting by abundance…",
			"[step] Detecting chimeras (de novo)…",
			"[warn] Chimeras found: 142",
			"[info] Writing non-chimeric ASVs…",
			"[info] Retained ASVs: 2,705",
			"[done] ✓ Complete"
		]
	},
	{
		command: "blastn -db nt -query asvs.fasta",
		lines: [
			"[info] Connecting to NCBI…",
			"[info] Query: 2,705 ASVs",
			"[step] Searching nt database…",
			"[step] Processing hits…",
			"[info] Matches found: 2,651",
			"[info] Top-hit identity: 99.8%",
			"[info] Writing taxonomy report…",
			"[done] ✓ Complete"
		]
	},
	{
		command: "qiime feature-table summarize",
		lines: [
			"[info] Loading feature table…",
			"[info] Samples: 96",
			"[info] Features: 2,705",
			"[info] Total frequency: 18,402,119",
			"[step] Computing per-sample stats…",
			"[info] Median frequency: 181,204",
			"[info] Min frequency: 22,311",
			"[info] Max frequency: 612,904",
			"[done] ✓ Complete"
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
	const scrollRef = useRef<HTMLDivElement | null>(null);

	const currentSequence = terminalSequences[sequenceIndex];
	const prompt = useMemo(() => "ocean-dna@lab:~$", []);

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
			}, 180);
		} else {
			// All lines shown, wait then move to next sequence
			timeoutRef.current = setTimeout(() => {
				setSequenceIndex((prev) => (prev + 1) % terminalSequences.length);
				setVisibleLines([]);
				setTypedCommand("");
				setIsTyping(true);
				setCurrentLineIndex(0);
			}, 1600);
		}

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [currentLineIndex, isTyping, currentSequence.lines]);

	// Auto-scroll as more lines appear
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [visibleLines, typedCommand]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	return (
		<LaptopScreen className={className ?? ""} screenBounds={screenBounds} alt="Laptop showing bioinformatics analysis">
			<div className="w-full h-full bg-base-200 [html[data-theme='dark']_&]:bg-slate-800 overflow-hidden font-mono text-left flex flex-col">
				{/* Terminal header */}
				<div className="flex items-center gap-1.5 px-2 py-2 border-b border-base-300 [html[data-theme='dark']_&]:border-slate-600 shrink-0">
					<div className="w-2.5 h-2.5 rounded-full bg-red-400 [html[data-theme='dark']_&]:bg-red-500" />
					<div className="w-2.5 h-2.5 rounded-full bg-yellow-400 [html[data-theme='dark']_&]:bg-yellow-500" />
					<div className="w-2.5 h-2.5 rounded-full bg-green-400 [html[data-theme='dark']_&]:bg-green-500" />
					<span className="ml-2 text-base-content/50" style={{ fontSize: 10 }}>analysis.sh</span>
				</div>

				{/* Terminal content */}
				<div
					ref={scrollRef}
					className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
					style={{
						fontSize: 10,
						lineHeight: 1.25,
						scrollbarWidth: "none"
					}}
				>
					{/* Command line */}
					<div className="flex items-center gap-1">
						<span className="text-success">{prompt}</span>
						<span className="text-base-content">{typedCommand}</span>
						{isTyping && <span className="animate-pulse text-base-content">▌</span>}
					</div>

					{/* Output lines */}
					{visibleLines.map((line, i) => (
						<div
							key={i}
							className={`${
								line.includes("[done]") || line.startsWith("✓") ? "text-success" : 
								line.includes("[warn]") ? "text-warning" :
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
