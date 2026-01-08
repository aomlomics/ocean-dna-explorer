"use client";

import React, { useCallback, useState } from "react";
import ProjectViz from "./project_viz";
import SampleViz from "./sample_viz";
import BioinfoViz from "./bioinfo_viz";
import AnalysisViz from "./analysis_viz";
import WaterSurface from "./WaterSurface";

export type VizStep = "project" | "sample" | "bioinfo" | "analysis";

const STEPS: VizStep[] = ["project", "sample", "bioinfo", "analysis"];

// Define zoom hotspots for each step - adjusted to target actual content
// Camera targets expressed in viewport coords so final content centers on screen
// You can tweak these numbers live:
// - project.ctdPan: where the camera should be after zooming into the CTD
// - sample.niskinPan: where the camera should be after zooming into the Niskin
const ZOOM_CONFIG = {
	project: { scale: 1, x: 0, y: 0, ctdPan: { scale: 6.5, x: -180, y: -60 } },
	sample: { scale: 1, x: 0, y: 0, niskinPan: { scale: 3, x: 0, y: 0 } },
	bioinfo: { scale: 8, x: 0, y: -20 },
	analysis: { scale: 1, x: 0, y: 0 }
};

const EDNAVisualization: React.FC = () => {
	const [currentStep, setCurrentStep] = useState<VizStep>("project");
	const [isAnimating, setIsAnimating] = useState(false);
	const [isWaterlineVisible, setIsWaterlineVisible] = useState(true);
	const [viewportZoom, setViewportZoom] = useState<{ scale: number; x: number; y: number }>(
		{ scale: ZOOM_CONFIG.project.scale, x: ZOOM_CONFIG.project.x, y: ZOOM_CONFIG.project.y }
	);

	// Compute the entry transform for any step so all transitions feel consistent.
	// Special case: project -> sample should zoom slightly to the right.
	const getStepEntryTransform = useCallback((step: VizStep, fromStep?: VizStep) => {
		if (step === "project") {
			return { scale: ZOOM_CONFIG.project.scale, x: ZOOM_CONFIG.project.x, y: ZOOM_CONFIG.project.y };
		}
		if (step === "sample") {
			const base = ZOOM_CONFIG.sample.niskinPan;
			const NUDGE = { x: 12, y: 8 }; // subtle bottom-right emphasis when diving from project
			return fromStep === "project"
				? { scale: base.scale, x: base.x + NUDGE.x, y: base.y + NUDGE.y }
				: { scale: base.scale, x: base.x, y: base.y };
		}
		if (step === "bioinfo") {
			return { scale: ZOOM_CONFIG.bioinfo.scale, x: ZOOM_CONFIG.bioinfo.x, y: ZOOM_CONFIG.bioinfo.y };
		}
		if (step === "analysis") {
			return { scale: ZOOM_CONFIG.analysis.scale, x: ZOOM_CONFIG.analysis.x, y: ZOOM_CONFIG.analysis.y };
		}
		// Fallback for safety, though should not be reached
		return { scale: 1, x: 0, y: 0 };
	}, []);

	const goToStep = useCallback(
		(step: VizStep) => {
			if (isAnimating || step === currentStep) return;

			// Handle water fade-out separately when leaving the project view
			if (currentStep === "project" && step !== "project") {
				setIsAnimating(true);
				setIsWaterlineVisible(false); // Start fade-out

				// Wait for fade-out to finish, then zoom
				setTimeout(() => {
					const target = getStepEntryTransform(step, currentStep);
					setCurrentStep(step);
					requestAnimationFrame(() => {
						setViewportZoom({ scale: target.scale, x: target.x, y: target.y });
					});
					setTimeout(() => setIsAnimating(false), 600);
				}, 100); // Corresponds to the fade-out duration
			} else {
				setIsAnimating(true);
				// When returning to project, delay the water's appearance
				if (step === "project") {
					// The main zoom is 600ms, the water fade is 300ms.
					// Start the fade so it finishes roughly with the zoom.
					setTimeout(() => {
						setIsWaterlineVisible(true);
					}, 200); // Start fade-in halfway through the 600ms zoom
				}
				const target = getStepEntryTransform(step, currentStep);
				setCurrentStep(step);

				requestAnimationFrame(() => {
					setViewportZoom({ scale: target.scale, x: target.x, y: target.y });
				});

				setTimeout(() => setIsAnimating(false), 600);
			}
		},
		[currentStep, isAnimating, getStepEntryTransform]
	);

	const handleNext = useCallback(() => {
		const currentIndex = STEPS.indexOf(currentStep);
		if (currentIndex < STEPS.length - 1) {
			const next = STEPS[currentIndex + 1];
			goToStep(next);
		}
	}, [currentStep, goToStep]);

	const handleBack = useCallback(() => {
		const currentIndex = STEPS.indexOf(currentStep);
		if (currentIndex > 0) {
			const prev = STEPS[currentIndex - 1];
			goToStep(prev);
		}
	}, [currentStep, goToStep]);

	return (
		<div className="relative w-full h-[600px] overflow-hidden rounded-lg bg-base-100/50 dark:bg-base-300/5">
			{/* Subtle dark ocean background */}
			<div className="absolute inset-0 bg-gradient-to-b from-slate-800/40 to-slate-900/60 dark:from-slate-900/60 dark:to-slate-950/80" />
			<div
				className={`absolute top-[107px] left-0 right-0 transition-opacity duration-300 ${
					isWaterlineVisible ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
			>
				<WaterSurface />
			</div>

			{/* Main viewport - this is what zooms and pans */}
			<div
				className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(.22,1,.36,1)] will-change-transform"
				style={{
					transform: `translate(${viewportZoom.x}px, ${viewportZoom.y}px) scale(${viewportZoom.scale})`,
					transformOrigin: "50% 50%"
				}}
			>
				{/* All components render simultaneously, visibility controlled by opacity */}
				<div
					className={`absolute inset-0 transition-opacity duration-300 ${
						currentStep === "project" ? "opacity-100" : "opacity-0 pointer-events-none"
					}`}
				>
					<ProjectViz />
				</div>

				<div
					className={`absolute inset-0 transition-opacity duration-300 ${
						currentStep === "sample" ? "opacity-100" : "opacity-0 pointer-events-none"
					}`}
				>
					<SampleViz onNext={handleNext} onBack={handleBack} />
				</div>

				<div
					className={`absolute inset-0 transition-opacity duration-300 ${
						currentStep === "bioinfo" ? "opacity-100" : "opacity-0 pointer-events-none"
					}`}
				>
					<BioinfoViz onNext={handleNext} onBack={handleBack} />
				</div>
			</div>

			{/* Analysis Step - Slides in from the right */}
			<div
				className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
					currentStep === "analysis" ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<AnalysisViz onBack={handleBack} isActive={currentStep === "analysis"} />
			</div>

			{/* Back button for non-project steps */}
			{currentStep !== "project" && (
				<button
					onClick={handleBack}
					disabled={isAnimating}
					className="absolute top-4 left-4 z-40 btn btn-sm btn-primary"
				>
					← Back
				</button>
			)}

			{/* Step indicator dots */}
			<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
				{STEPS.map((step, index) => (
					<button
						key={step}
						onClick={() => goToStep(step)}
						disabled={isAnimating}
						className={`w-2 h-2 rounded-full transition-colors duration-200 ${
							step === currentStep ? "bg-primary" : "bg-base-content/30 hover:bg-base-content/50"
						}`}
						aria-label={`Go to ${step}`}
					/>
				))}
			</div>
		</div>
	);
};

export default EDNAVisualization;
