"use client";

import React from "react";
import { DnaIcon } from "../icons";

interface BioinfoVizProps {
	onNext: () => void;
	onBack: () => void;
}

const BioinfoViz: React.FC<BioinfoVizProps> = ({ onNext, onBack }) => {
	const handleMagnifyingGlassClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onNext();
	};

	return (
		<div className="relative w-full h-full overflow-hidden">
			{/* DNA Helix Icon */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-2 -ml-9 text-primary">
				<DnaIcon />
			</div>

			{/* Laptop Icon */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-2 ml-8 text-primary">
				<div
					className="w-16 h-16"
					style={{
						backgroundColor: "currentColor",
						WebkitMaskImage: "url(/images/icons/laptop_icon.svg)",
						maskImage: "url(/images/icons/laptop_icon.svg)",
						WebkitMaskRepeat: "no-repeat",
						maskRepeat: "no-repeat",
						WebkitMaskPosition: "center",
						maskPosition: "center",
						WebkitMaskSize: "contain",
						maskSize: "contain"
					}}
				/>
			</div>

			{/* DNA Text */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-6 -ml-9 text-center">
				<div className="text-[0.25rem] leading-[0.3rem] font-medium text-base-content/80">DNA Sequence</div>
				<div className="text-[0.2rem] leading-1 text-base-content/60">Raw eDNA Data</div>
			</div>

			{/* Bioinfo Text */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-6 ml-8 text-center">
				<div className="text-[0.25rem] leading-[0.3rem] font-medium text-base-content/80">Bioinformatics</div>
				<div className="text-[0.2rem] leading-1 text-base-content/60">Data Processing</div>
			</div>

			{/* Magnifying glass at bottom center */}
			<button
				onClick={handleMagnifyingGlassClick}
				className="absolute left-1/2 bottom-8 -translate-x-1/2 flex items-center justify-center text-primary cursor-pointer z-40 animate-pulse"
				aria-label="Zoom to Analysis"
				style={{
					animationDuration: "3s",
					animationIterationCount: "infinite"
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="1.5"
					stroke="currentColor"
					className="w-2 h-2"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6"
					/>
				</svg>
			</button>
		</div>
	);
};

export default BioinfoViz;
