"use client";

import React, { useState, useEffect } from "react";

// --- Configuration ---
const INCORRECT_OUTLINES = [
	"/images/outlines/xl_lamniformes.svg",
	"/images/outlines/md_shrimp.svg",
	"/images/outlines/sm_copepod.svg",
	"/images/outlines/lg_bluefin_tuna.svg",
	"/images/outlines/sm_pterocorys.svg",
	"/images/outlines/sm_salmonella.svg",
	"/images/outlines/sm_strombidiidae.svg"
];
const CORRECT_OUTLINE = "/images/outlines/xl_dolphin.svg";
const ANIMATION_INTERVAL = 400; // ms between flashes
const FINAL_FADE_IN_DELAY = 500; // ms after animation to fade in details

const ALL_OUTLINES = [...INCORRECT_OUTLINES, CORRECT_OUTLINE];

const TAXONOMY_DATA = [
	{ rank: "Kingdom", value: "Eukaryota" },
	{ rank: "Phylum", value: "Chordata" },
	{ rank: "Class", value: "Mammalia" },
	{ rank: "Order", value: "Artiodactyla" },
	{ rank: "Family", value: "Delphinidae" },
	{ rank: "Genus", value: "Tursiops" },
	{ rank: "Species", value: "Tursiops truncatus" }
];

// Exact laptop screen bounds from SVG viewBox (1200x800)
const SCREEN_LEFT_PCT = 23.84; // 284.558 / 1200 * 100
const SCREEN_TOP_PCT = 26.78; // 194.93 / 800 * 100
const SCREEN_WIDTH_PCT = 52.4; // 630.924 / 1200 * 100
const SCREEN_HEIGHT_PCT = 44.5; // 395.793 / 800 * 100

// --- Component ---
interface AnalysisVizProps {
	onBack: () => void;
	isActive: boolean;
}

const AnalysisViz: React.FC<AnalysisVizProps> = ({ onBack, isActive }) => {
	const [animationStep, setAnimationStep] = useState(0);
	const [showFinalContent, setShowFinalContent] = useState(false);

	const currentOutline = ALL_OUTLINES[animationStep] ?? CORRECT_OUTLINE;

	useEffect(() => {
		if (!isActive) {
			setShowFinalContent(false);
			setAnimationStep(0);
			return;
		}

		// Reset and start animation when it becomes active
		setShowFinalContent(false);
		setAnimationStep(0);

		const timer = setInterval(() => {
			setAnimationStep(prevStep => {
				const nextStep = prevStep + 1;

				// If we've reached the final outline, stop the timer.
				if (nextStep >= ALL_OUTLINES.length - 1) {
					clearInterval(timer);
					setTimeout(
						() => setShowFinalContent(true),
						FINAL_FADE_IN_DELAY
					);
				}

				// Don't advance past the end of the list.
				if (nextStep >= ALL_OUTLINES.length) {
					return prevStep;
				}

				return nextStep;
			});
		}, ANIMATION_INTERVAL);

		return () => {
			clearInterval(timer);
		};
	}, [isActive]);

	return (
		<div className="relative w-full h-full flex items-center justify-center p-8">
			{/* Container for both laptop and screen */}
			<div className="relative w-[85rem] h-[50em]">
				{/* 1. Laptop Base Icon (the frame) */}
				<div className="absolute inset-0 w-full h-full text-primary z-0 pointer-events-none">
					<svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
						<g>
							<path d="M927.71,614.503H273.102V190.878c0-10.544,8.548-19.092,19.092-19.092h616.424c10.544,0,19.092,8.548,19.092,19.092V614.503z" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10} />
							<path d="M932.761,614.503h-664.71V186.495c0-10.681,8.658-19.339,19.339-19.339h626.032c10.681,0,19.339,8.658,19.339,19.339V614.503z" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10} />
							<rect x={284.558} y={194.93} width={630.924} height={395.793} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10} />
							<path d="M193.995,614.579v4.827h327.332c3.225,0,6.427,0.459,9.566,1.207c0.369,0.09,0.741,0.169,1.117,0.238v-6.271H193.995z" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10} />
							<path d="M667.99,614.579v6.271c-1.394,0.259-2.812,0.393-4.237,0.393H536.247c-1.425,0-2.843-0.134-4.237-0.393v-6.271H667.99z" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10} />
							<path d="M523.021,619.405c0,0,6,0.412,9,1.412h136c0,0,4-1,8-1.412h329.371c0.112,0,0.136,0.161,0.029,0.194c-28.36,8.779-57.879,13.245-87.569,13.245H600.021H282.189c-29.69,0-59.21-4.465-87.569-13.245c-0.107-0.033-0.083-0.194,0.029-0.194H523.021" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10} />
							<path d="M1006.005,614.579v4.827H678.674c-3.225,0-6.427,0.459-9.566,1.207c-0.369,0.09-0.741,0.169-1.117,0.238v-6.271H1006.005z" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10} />
						</g>
					</svg>
				</div>

				{/* 2. Screen Content Overlay (the content) */}
				<div
					className="absolute z-10 flex flex-col text-base-content overflow-hidden bg-base-100"
					style={{
						top: `${SCREEN_TOP_PCT}%`,
						left: `${SCREEN_LEFT_PCT}%`,
						width: `${SCREEN_WIDTH_PCT}%`,
						height: `${SCREEN_HEIGHT_PCT}%`
					}}
				>
					{/* A. Final Content (shown when animation is done) */}
					<div
						className={`absolute inset-0 flex flex-col transition-opacity duration-500 ${
							showFinalContent ? "opacity-100" : "opacity-0"
						}`}
					>
						<div className="flex flex-col h-full w-full origin-top scale-[0.96] px-6 pt-4 pb-8">
							<h3 className="text-3xl font-normal text-primary whitespace-nowrap">
								Common Bottlenose Dolphin
							</h3>
							<div className="flex-grow flex items-center gap-8 mt-4">
								{/* Left Panel: Image Box */}
								<div className="w-1/3 h-full bg-base-200/40 rounded-lg flex flex-col items-center justify-center p-4 gap-4">
									<div
										className="w-full flex-grow bg-primary"
										style={{
											WebkitMaskImage: `url(${CORRECT_OUTLINE})`,
											maskImage: `url(${CORRECT_OUTLINE})`,
											WebkitMaskSize: "contain",
											maskSize: "contain",
											WebkitMaskPosition: "center",
											maskPosition: "center",
											WebkitMaskRepeat: "no-repeat",
											maskRepeat: "no-repeat"
										}}
									/>
									<p className="text-2xl font-bold text-success flex-shrink-0">
										ASSIGNED
									</p>
								</div>

								{/* Right Panel: Details */}
								<div className="w-2/3">
									<div className="space-y-2 text-lg">
										{TAXONOMY_DATA.map(item => (
											<div
												key={item.rank}
												className="grid grid-cols-2 items-baseline"
											>
												<span className="font-semibold text-base-content/70">
													{item.rank}
												</span>
												<span className="font-mono text-base-content">
													{item.value}
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* B. Animation Content (shown during animation) */}
					<div
						className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${
							showFinalContent
								? "opacity-0 pointer-events-none"
								: "opacity-100"
						}`}
					>
						<div className="text-3xl font-semibold text-base-content/70 mb-6">
							Assigning taxonomy...
						</div>
						<div
							key={currentOutline}
							className="w-48 h-48 bg-primary animate-flash"
							style={{
								WebkitMaskImage: `url(${currentOutline})`,
								maskImage: `url(${currentOutline})`,
								WebkitMaskSize: "contain",
								maskSize: "contain",
								WebkitMaskPosition: "center",
								maskPosition: "center",
								WebkitMaskRepeat: "no-repeat",
								maskRepeat: "no-repeat"
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
export default AnalysisViz;

