"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import LaptopScreen, { type LaptopScreenBounds } from "@/app/components/LaptopScreen";

// Terminal commands that cycle through
const terminalSequences = [
	{
		command: "./tourmaline.sh --step repseqs --configfile config_02_repseqs.yaml",
		lines: [
			"Running repseqs step with cores 8...",
			"Assuming unrestricted shared filesystem usage.",
			"Host: nostromo.aoml.noaa.gov",
			"Building DAG of jobs...",
			"",
			"[09:53:48] localrule cp_metadata:",
			"    input: metadata/metadata.tsv",
			"    output: stats/metadata_used.tsv",
			"    Status: 1 of 16 steps (6%) done",
			"",
			"[09:54:12] localrule denoise_dada2_pe:",
			"    input: seqRunId/251219-qaqc/251219_fastq.qza",
			"    Activating conda environment: qiime2-amplicon-2024.10",
			"    ",
			"    > Success: Forward read length (300) > dada2_trunc_len_f (245)",
			"    > Success: Reverse read length (300) > dada2_trunc_len_r (190)",
			"    ",
			"    Running DADA2 paired-end denoising...",
			"    R version 4.3.3 | DADA2: 1.30.0",
			"    1) Filtering ................",
			"    2) Learning Error Rates (3230570 total bases)",
			"    3) Denoise samples ................",
			"    4) Remove chimeras (method = consensus)",
			"    ",
			"    Saved FeatureTable[Frequency] to: 251219-table.qza",
			"    Saved FeatureData[Sequence] to: 251219-repseqs.qza",
			"    Status: 2 of 16 steps (12%) done",
			"",
			"[09:55:48] Executing Parallel Diversity Metrics...",
			"    > Running alpha_rarefaction... [DONE]",
			"    > Running visualize_repseqs... [DONE]",
			"    > Exporting BIOM table...       [DONE]",
			"",
			"[09:56:01] localrule diversity_core_metrics:",
			"    input: 251219-table.qza, metadata_used.tsv",
			"    > Generated Jaccard Distance Matrix",
			"    > Generated Bray-Curtis PCoA Results",
			"    > Saved Visualization: bray_curtis_emperor.qzv",
			"",
			"[09:56:48] Finished jobid: 0 (Rule: run_denoise)",
			"16 of 16 steps (100%) done",
			"Workflow Complete............"
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
		<LaptopScreen
			className={className ?? ""}
			// These bounds control how much of the laptop PNG is treated as “screen”.
			// Tweak: smaller left/right => wider terminal; smaller bottom => taller terminal.
			screenBounds={
				screenBounds ?? {
					top: 10,
					left: 13.5,
					right: 13.5,
					bottom: 36.5
				}
			}
			alt="Laptop showing bioinformatics analysis"
			// Tweak this (0-4) to make the terminal panel hug the laptop PNG screen.
			contentPaddingPercent={1}
		>
			<div className="w-full h-full font-mono text-left flex items-center justify-center">
				{/* Terminal window (should match the laptop screen area). */}
				<div
					className="w-full h-full rounded-xl overflow-hidden bg-base-200 [html[data-theme='dark']_&]:bg-slate-800 border border-base-300/70 [html[data-theme='dark']_&]:border-slate-600/70 flex flex-col"
					style={{
						// Tweak this if the rounded corners don't match the PNG screen corners.
						borderRadius: 12
					}}
				>
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
							// Tweak fontSize/lineHeight to prevent clipping on smaller screens.
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
							className={`whitespace-pre ${
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
			</div>
		</LaptopScreen>
	);
}
