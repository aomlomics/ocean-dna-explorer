"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// Marine species with verified scientific names
const identifications = [
	{ src: "/images/outlines/xl_dolphin.svg", common: "Bottlenose Dolphin", scientific: "Tursiops truncatus", confidence: "98.7" },
	{ src: "/images/outlines/lg_bluefin_tuna.svg", common: "Bluefin Tuna", scientific: "Thunnus thynnus", confidence: "94.2" },
	{ src: "/images/outlines/xl_lamniformes.svg", common: "Great White Shark", scientific: "Carcharodon carcharias", confidence: "91.5" },
	{ src: "/images/outlines/sm_copepod.svg", common: "Copepod", scientific: "Calanus finmarchicus", confidence: "89.3" }
];

// Generate random MD5-like hash for feature ID
function generateFeatureId(): string {
	const chars = "0123456789abcdef";
	return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * 16)]).join("");
}

// Generate random DNA sequence
function generateSequence(length: number): string {
	const bases = ["A", "C", "T", "G"];
	return Array.from({ length }, () => bases[Math.floor(Math.random() * 4)]).join("");
}

interface TaxonomyLaptopProps {
	className?: string;
}

export default function TaxonomyLaptop({ className }: TaxonomyLaptopProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [phase, setPhase] = useState<"feature" | "matching" | "assignment">("feature");
	const [featureId, setFeatureId] = useState(generateFeatureId());
	const [sequence, setSequence] = useState(generateSequence(24));
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [flashingOutlineIndex, setFlashingOutlineIndex] = useState(0);
	const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
	const flashIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Clear all timeouts on unmount
	useEffect(() => {
		return () => {
			timeoutRefs.current.forEach(clearTimeout);
			if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
		};
	}, []);

	// Flash through outlines during matching phase
	useEffect(() => {
		if (phase === "matching") {
			flashIntervalRef.current = setInterval(() => {
				setFlashingOutlineIndex((prev) => (prev + 1) % identifications.length);
			}, 200);
		} else {
			if (flashIntervalRef.current) {
				clearInterval(flashIntervalRef.current);
				flashIntervalRef.current = null;
			}
		}
		return () => {
			if (flashIntervalRef.current) {
				clearInterval(flashIntervalRef.current);
				flashIntervalRef.current = null;
			}
		};
	}, [phase]);

	useEffect(() => {
		// Clear previous timeouts
		timeoutRefs.current.forEach(clearTimeout);
		timeoutRefs.current = [];

		const startCycle = () => {
			// Generate new data at start of cycle
			setFeatureId(generateFeatureId());
			setSequence(generateSequence(24));
			setPhase("feature");
			setIsTransitioning(false);

			// Phase 2: Matching (after 4s)
			const t1 = setTimeout(() => {
				setIsTransitioning(true);
				setTimeout(() => {
					setPhase("matching");
					setIsTransitioning(false);
				}, 500);
			}, 4000);

			// Phase 3: Assignment (after 7.5s)
			const t2 = setTimeout(() => {
				setIsTransitioning(true);
				setTimeout(() => {
					setPhase("assignment");
					setIsTransitioning(false);
				}, 500);
			}, 7500);

			// Next species (after 12s) - smooth transition
			const t3 = setTimeout(() => {
				setIsTransitioning(true);
				setTimeout(() => {
					setCurrentIndex((prev) => (prev + 1) % identifications.length);
				}, 500);
			}, 12000);

			timeoutRefs.current = [t1, t2, t3];
		};

		startCycle();
		const interval = setInterval(startCycle, 13000);

		return () => {
			clearInterval(interval);
			timeoutRefs.current.forEach(clearTimeout);
		};
	}, [currentIndex]);

	const current = identifications[currentIndex];

	return (
		<div className={`relative w-full h-full flex items-center justify-center ${className ?? ""}`}>
			{/* Fixed aspect ratio container matching the laptop image proportions */}
			<div
				className="relative w-full h-auto max-h-full"
				style={{ aspectRatio: "1320 / 1080" }}
			>
				{/* Laptop base image */}
				<Image
					src="/images/biorender/laptop.png"
					alt="Laptop showing taxonomy identification"
					fill
					sizes="(max-width: 1024px) 100vw, 50vw"
					className="object-contain"
					priority
				/>

				{/* Screen content container - positioned to cover the laptop screen area */}
				<div
					className="absolute overflow-hidden"
					style={{
						top: "8%",
						left: "16%",
						right: "16%",
						bottom: "46%"
					}}
				>
					{/* Content wrapper with transition - centered both ways */}
					<div 
						className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-500 ${
							isTransitioning ? "opacity-0" : "opacity-100"
						}`}
					>
						{/* Phase 1: Feature - pushed down */}
						{phase === "feature" && (
							<div className="flex flex-col items-center justify-center pt-[6%]">
								<p className="text-[0.9em] sm:text-[1em] font-bold text-primary mb-1">
									FEATURE
								</p>
								<p className="text-[0.6em] sm:text-[0.7em] text-base-content/80">
									feature_id:
								</p>
								<p className="text-primary font-mono text-[0.5em] sm:text-[0.55em] mb-1 break-all leading-tight">
									{featureId}
								</p>
								<p className="text-[0.55em] sm:text-[0.65em] text-base-content/70">
									Sequence:
								</p>
								<p className="text-primary font-mono text-[0.5em] sm:text-[0.6em] break-all leading-tight">
									{sequence}
								</p>
							</div>
						)}

						{/* Phase 2: Matching - flashing outlines, nudged down */}
						{phase === "matching" && (
							<div className="flex flex-col items-center justify-center pt-[12%]">
								<div
									className="w-[28%] aspect-square mb-2 opacity-60"
									style={{
										backgroundColor: "var(--color-primary)",
										WebkitMaskImage: `url(${identifications[flashingOutlineIndex].src})`,
										maskImage: `url(${identifications[flashingOutlineIndex].src})`,
										WebkitMaskRepeat: "no-repeat",
										maskRepeat: "no-repeat",
										WebkitMaskPosition: "center",
										maskPosition: "center",
										WebkitMaskSize: "contain",
										maskSize: "contain"
									}}
								/>
								<div className="flex items-center gap-2 mb-1">
									<div className="w-4 h-4 border-[2px] border-primary/30 border-t-primary rounded-full animate-spin" />
									<p className="text-[0.9em] sm:text-[1em] font-bold text-primary">
										MATCHING
									</p>
								</div>
								<p className="text-[0.6em] sm:text-[0.7em] text-base-content/70">
									Comparing against NCBI / BOLD
								</p>
							</div>
						)}

						{/* Phase 3: Assignment - clean vertical layout, shifted down */}
						{phase === "assignment" && (
							<div className="flex flex-col items-center justify-end h-full pt-[8%]">
								<div
									className="w-[55%] aspect-square"
									style={{
										backgroundColor: "var(--color-primary)",
										WebkitMaskImage: `url(${current.src})`,
										maskImage: `url(${current.src})`,
										WebkitMaskRepeat: "no-repeat",
										maskRepeat: "no-repeat",
										WebkitMaskPosition: "center",
										maskPosition: "center",
										WebkitMaskSize: "contain",
										maskSize: "contain"
									}}
								/>
								<p className="text-[0.9em] sm:text-[1.1em] font-semibold text-primary leading-tight">
									{current.common}
								</p>
								<p className="text-[0.65em] sm:text-[0.75em] italic text-base-content/70 leading-tight">
									{current.scientific}
								</p>
								<p className="text-[0.65em] sm:text-[0.75em] text-success font-bold leading-tight">
									{current.confidence}% match
								</p>
								<p className="text-[0.8em] sm:text-[1em] font-bold text-success leading-tight">
									✓ ASSIGNMENT
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
