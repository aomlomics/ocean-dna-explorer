"use client";

import React from "react";

interface SampleVizProps {
	onNext: () => void;
	onBack: () => void;
}

const SampleViz: React.FC<SampleVizProps> = ({ onNext, onBack }) => {
	const handleMagnifyingGlassClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onNext();
	};

	return (
		<div className="relative w-full h-full overflow-hidden">
			{/* Niskin bottle inline (from SVG path), primary blue */}
			<div className="absolute inset-0 flex items-center justify-center z-30 mb-4">
				<div className="text-primary">
					<svg
						viewBox="0 0 215.27 892.2"
						className="w-[2.8rem] max-w-[8vw] max-h-[14%] h-auto rotate-20"
						fill="none"
						stroke="currentColor"
						strokeWidth="3"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M140.47,104.49h34.4c3.1,3.6.8,9.8,1.5,14.3-.5,2.2-6.4-.4-6,3.1l42.9,40,2,5v566.1l-1.5,4.5-43.4,40.5,6.8,5.2c.6,2.2.8,12.3-2.3,12.3h-34.4v85.5c0,1.2-3.7,7.1-5,8-2.1,1.3-7.7,2.4-10.4,2.6-7.3.6-26,1-32.9,0-3-.5-10.5-5.7-10.5-8.4v-86l-1.5-1.5h-33.9c-3.1,0-3-11-2.3-13.3,1.3-4.3,8-1.4,6.8-4.2-2.2-1.7-5.4-7.2-8.3-6.4-1.6.4-2.7,3.3-4.4,3.8-2.3.6-4.6-1.4-6.6-.8-1.2.4-8.2,9.8-10.1,11-1.4.8-2.2,1.2-4,1-1.3-.2-15.6-13.8-16.6-15.5-4.4-7.5,11.6-14.2,10.9-17.8-.2-.8-1.8-1.7-1.7-3,.1-2.2,3.9-4.2,3.9-6.2l-7.1-10c-2.1-184,3.4-368.1-1-552-.1-6.1-1.1-14.5,2.5-19.6l43.4-41.5-7.1-2.1c-1.8-4.7-.8-9.7.1-14.4h35.4l1.5-1.5V8.19c0-2.5,6.5-7,9.6-7.4,7.7-1.1,29.9-1,37.8,0,4.8.5,11.5,5.8,11.5,10.5v93.5h0v-.3ZM132.47,8.49c-2.5-4.9-10.5-2.8-15.4-3-5.3-.2-7.7-.2-13,0-4.1.2-14-1.9-14.4,3h42.9-.1ZM86.57,13.49v81.5l1.5,1.5h45.9l1.5-1.5V14.99l-1.5-1.5h-47.4ZM86.57,104.49h47.4c.5,0,2.1-2.2,1.5-3-1.5-.3-2.9-.9-4.5-1-9.6-.9-31.6-1.1-41,0-1.1.1-2.2,0-3,1l-.4,3.1h0v-.1ZM48.67,109.49l1.5,6h120.7c2,0,2-6,0-6H48.67ZM18.27,162.49h186c.4-1.8-.7-2-1.5-3-2.5-3.3-7.8-7.9-11-11-9.8-9.5-20.6-18-30.2-27.8H58.77c0,.1-41.7,39.8-41.7,39.8l1,2h.2ZM211.27,167.49H10.77v563.5c0,4,8.5,1.5,10.4,1.5,62.2-1.2,124.5,1,186.6,0l3.4-1.5V167.49h.1ZM204.27,737.49H16.77c1.6,4,6.2,7.9,9.4,11,4.2,4,32.8,31.2,35.2,31.8l100-.3c2.9-3.6,6.8-6,10-9,9.2-8.3,24.2-21.1,31.9-30,1.1-1.3,1.3-1.7,1-3.5h0ZM21.27,749.89c-1-.7-1.9-1.6-3.1-2.2l-2.5,2.2c6.1,4.9,11.8,13.5,17.9,18,3.6,2.7,6.1,1.2,4.1-2.8-6.2-4.1-10.5-10.9-16.4-15.3h0v.1ZM19.37,759.79c-1-.9-2.2-1.5-3.3-2.2l-10.3,10.3,12.5,12.5,10.4-9.7c.1-.7-8.1-10-9.3-11h0v.1ZM48.67,790.49h122.2c2,0,2-6,0-6H48.67v6h0ZM86.57,795.49c-.4,1.2.4,4,1.5,4h45.9l1.5-2.5-1.5-1.5h-47.4ZM86.57,878.49h47.4l1.5-1.5v-72l-1.5-1.5h-45.9l-1.5,1.5v73.5h0ZM132.47,883.49h-42.9c-.2,2-.2,1.7,1.2,2.3,3.4,1.5,30.9,1.2,36.2.7,1.6-.1,6.4-.3,5.5-3h0Z" />
					</svg>
				</div>
			</div>

			{/* Small DNA helixes floating inside niskin bottle */}
			<div className="absolute inset-0 pointer-events-none">
				{/* Small DNA helix 1 - degraded (shorter) */}
				<div className="absolute left-[50.5%] top-[43%] -translate-x-1/2 -translate-y-1/2 text-primary/60 rotate-120">
					<div
						className="w-5 h-5"
						style={{
							backgroundColor: "currentColor",
							WebkitMaskImage: "url(/images/icons/dna_icon.svg)",
							maskImage: "url(/images/icons/dna_icon.svg)",
							WebkitMaskRepeat: "no-repeat",
							maskRepeat: "no-repeat",
							WebkitMaskPosition: "center",
							maskPosition: "center",
							WebkitMaskSize: "contain",
							maskSize: "contain"
						}}
					/>
				</div>
				{/* Small DNA helix 2 - more degraded (missing one side) */}
				<div className="absolute left-[52%] top-[43%] -translate-x-1/2 -translate-y-1/2 text-primary/60 rotate-4">
					<div
						className="w-6 h-6"
						style={{
							backgroundColor: "currentColor",
							WebkitMaskImage: "url(/images/icons/dna_icon.svg)",
							maskImage: "url(/images/icons/dna_icon.svg)",
							WebkitMaskRepeat: "no-repeat",
							maskRepeat: "no-repeat",
							WebkitMaskPosition: "center",
							maskPosition: "center",
							WebkitMaskSize: "contain",
							maskSize: "contain"
						}}
					/>
				</div>
				{/* Small DNA helix 3 - slightly degraded */}
				<div className="absolute left-[49%] top-[57%] -translate-x-1/2 -translate-y-1/2 text-primary/60 rotate-70">
					<div
						className="w-4 h-4"
						style={{
							backgroundColor: "currentColor",
							WebkitMaskImage: "url(/images/icons/dna_icon.svg)",
							maskImage: "url(/images/icons/dna_icon.svg)",
							WebkitMaskRepeat: "no-repeat",
							maskRepeat: "no-repeat",
							WebkitMaskPosition: "center",
							maskPosition: "center",
							WebkitMaskSize: "contain",
							maskSize: "contain"
						}}
					/>
				</div>
			</div>

			{/* Large DNA helix in middle of niskin bottle - using exact SVG */}
			<div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 text-primary">
				<div
					className="w-12 h-11"
					style={{
						backgroundColor: "currentColor",
						WebkitMaskImage: "url(/images/icons/dna_icon.svg)",
						maskImage: "url(/images/icons/dna_icon.svg)",
						WebkitMaskRepeat: "no-repeat",
						maskRepeat: "no-repeat",
						WebkitMaskPosition: "center",
						maskPosition: "center",
						WebkitMaskSize: "contain",
						maskSize: "contain"
					}}
				/>
			</div>

			{/* Small magnifying glass at bottom left of larger DNA helix */}
			<button
				onClick={handleMagnifyingGlassClick}
				className="absolute flex items-center justify-center text-primary cursor-pointer z-40 animate-pulse"
				aria-label="Zoom to Bioinformatics"
				style={{
					animationDuration: "3s",
					animationIterationCount: "infinite",
					top: "calc(50% + 0.6rem)", // Below the large helix
					left: "calc(50% - 1.2rem)" // Left of the large helix
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="1.5"
					stroke="currentColor"
					className="w-4 h-4"
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

export default SampleViz;
