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
	// Screen bounds as percentages of the laptop image
	// Adjust these values to match your laptop.png exactly
	screenBounds?: {
		top: number;    // % from top where screen starts
		left: number;   // % from left where screen starts
		right: number;  // % from right where screen ends
		bottom: number; // % from bottom where screen ends
	};
}

// Default screen bounds - adjust these to match laptop.png exactly
const DEFAULT_SCREEN_BOUNDS = {
	top: 7.5,
	left: 15.5,
	right: 15.5,
	bottom: 43
};

export default function TaxonomyLaptop({ className, screenBounds = DEFAULT_SCREEN_BOUNDS }: TaxonomyLaptopProps) {
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
			{/* Fixed aspect ratio container matching the laptop image proportions (1320x1080) */}
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

				{/* Screen content container - positioned to match laptop screen exactly */}
				<div
					className="absolute overflow-hidden"
					style={{
						top: `${screenBounds.top}%`,
						left: `${screenBounds.left}%`,
						right: `${screenBounds.right}%`,
						bottom: `${screenBounds.bottom}%`
					}}
				>
					{/* Content wrapper with transition - always centered */}
					<div 
						className={`absolute inset-0 flex flex-col items-center justify-center text-center p-[5%] transition-opacity duration-500 ${
							isTransitioning ? "opacity-0" : "opacity-100"
						}`}
					>
						{/* Phase 1: Feature */}
						{phase === "feature" && (
							<div className="flex flex-col items-center justify-center w-full">
								<p className="text-[clamp(10px,3.5cqw,16px)] font-bold text-primary mb-[2%]">
									FEATURE
								</p>
								<p className="text-[clamp(7px,2.5cqw,12px)] text-base-content/80">
									feature_id:
								</p>
								<p className="text-primary font-mono text-[clamp(6px,2cqw,10px)] mb-[2%] break-all leading-tight px-[5%]">
									{featureId}
								</p>
								<p className="text-[clamp(7px,2.5cqw,11px)] text-base-content/70">
									Sequence:
								</p>
								<p className="text-primary font-mono text-[clamp(6px,2.2cqw,11px)] break-all leading-tight px-[5%]">
									{sequence}
								</p>
							</div>
						)}

						{/* Phase 2: Matching - flashing outlines */}
						{phase === "matching" && (
							<div className="flex flex-col items-center justify-center w-full">
								<div
									className="w-[30%] aspect-square mb-[3%] opacity-60"
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
								<div className="flex items-center gap-[3%] mb-[2%]">
									<div className="w-[clamp(10px,3cqw,16px)] h-[clamp(10px,3cqw,16px)] border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
									<p className="text-[clamp(10px,3.5cqw,16px)] font-bold text-primary">
										MATCHING
									</p>
								</div>
								<p className="text-[clamp(7px,2.5cqw,12px)] text-base-content/70">
									Comparing against NCBI / BOLD
								</p>
							</div>
						)}

						{/* Phase 3: Assignment - compact layout that always fits */}
						{phase === "assignment" && (
							<div className="flex flex-col items-center justify-center w-full h-full">
								<div
									className="w-[40%] aspect-square mb-[2%]"
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
								<p className="text-[clamp(9px,3.2cqw,15px)] font-semibold text-primary leading-tight">
									{current.common}
								</p>
								<p className="text-[clamp(7px,2.3cqw,11px)] italic text-base-content/70 leading-tight">
									{current.scientific}
								</p>
								<p className="text-[clamp(7px,2.3cqw,11px)] text-success font-bold leading-tight">
									{current.confidence}% match
								</p>
								<p className="text-[clamp(8px,2.8cqw,13px)] font-bold text-success leading-tight mt-[1%]">
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
