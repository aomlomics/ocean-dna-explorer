"use client";

import { useState, useEffect, useRef } from "react";
import LaptopScreen, { type LaptopScreenBounds } from "@/app/components/LaptopScreen";

// Marine species with verified scientific names
const identifications = [
	{ src: "/images/outlines/xl_dolphin.svg", common: "Clymene Dolphin", scientific: "Stenella clymene", confidence: "98.7" },
	{ src: "/images/outlines/lg_bluefin_tuna.svg", common: "Bluefin Tuna", scientific: "Thunnus thynnus", confidence: "94.2" },
	{ src: "/images/outlines/xl_lamniformes.svg", common: "Order: Lamniformes", scientific: "Carcharodon carcharias", confidence: "91.5" },
	{ src: "/images/outlines/sm_copepod.svg", common: "Type of: Copepod", scientific: "Calanus finmarchicus", confidence: "92.3" }
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
	screenBounds?: LaptopScreenBounds;
}

export default function TaxonomyLaptop({ className, screenBounds }: TaxonomyLaptopProps) {
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
		<LaptopScreen className={className ?? ""} screenBounds={screenBounds} alt="Laptop showing taxonomy identification">
			<div
				className={`w-full h-full transition-opacity duration-500 ${
					isTransitioning ? "opacity-0" : "opacity-100"
				}`}
			>
				{/* Phase 1: Feature - fixed px for 320x220 reference; scales with LaptopScreen */}
				{phase === "feature" && (
					<div className="flex flex-col items-center justify-center w-full h-full">
						<p className="font-bold text-primary mb-2" style={{ fontSize: 22 }}>
							FEATURE
						</p>
						<p className="text-base-content/80 mb-1" style={{ fontSize: 15 }}>
							feature_id:
						</p>
						<p className="text-primary font-mono mb-2 break-all leading-tight px-2" style={{ fontSize: 14 }}>
							{featureId}
						</p>
						<p className="text-base-content/70 mb-1" style={{ fontSize: 15 }}>
							Sequence:
						</p>
						<p className="text-primary font-mono break-all leading-tight px-2" style={{ fontSize: 14 }}>
							{sequence}
						</p>
					</div>
				)}

				{/* Phase 2: Matching - flashing outlines */}
				{phase === "matching" && (
					<div className="flex flex-col items-center justify-center w-full h-full">
						<div
							className="aspect-square mb-2 opacity-60"
							style={{
								width: 96,
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
							<div className="w-[18px] h-[18px] border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
							<p className="font-bold text-primary" style={{ fontSize: 18 }}>
								MATCHING
							</p>
						</div>
						<p className="text-base-content/70" style={{ fontSize: 14 }}>
							Comparing against NCBI / BOLD
						</p>
					</div>
				)}

				{/* Phase 3: Assignment - compact layout for 320x220 */}
				{phase === "assignment" && (
					<div className="flex flex-col items-center justify-center w-full h-full">
						<div
							className="aspect-square"
							style={{
								width: 128,
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
						<p className="font-semibold text-primary leading-tight" style={{ fontSize: 17 }}>
							{current.common}
						</p>
						<p className="italic text-base-content/70 leading-tight" style={{ fontSize: 14 }}>
							{current.scientific}
						</p>
						<p className="text-success font-bold leading-tight mt-0.5" style={{ fontSize: 14 }}>
							✓ ASSIGNMENT: {current.confidence}%
						</p>
					</div>
				)}
			</div>
		</LaptopScreen>
	);
}
