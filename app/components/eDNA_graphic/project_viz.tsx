"use client";

import React, { useEffect, useRef, useState } from "react";

interface ProjectVizProps {
	onNext: () => void;
}

const ProjectViz: React.FC<ProjectVizProps> = ({ onNext }) => {
	const handleMagnifyingGlassClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		console.log("Project magnifying glass clicked - going to sample");
		onNext();
	};

	const containerRef = useRef<HTMLDivElement>(null);
	const boatRef = useRef<HTMLDivElement>(null);
	const ctdRef = useRef<HTMLDivElement>(null);
	const ctdIconRef = useRef<HTMLDivElement>(null);
	const magnifierRef = useRef<HTMLButtonElement>(null);
	const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
	const [connectorD, setConnectorD] = useState("");

	const computeConnector = () => {
		const container = containerRef.current;
		const boat = boatRef.current;
		const ctd = ctdRef.current;
		const ctdIcon = ctdIconRef.current;
		if (!container || !boat || !ctd) return;

		const cRect = container.getBoundingClientRect();
		const bRect = boat.getBoundingClientRect();
		// Prefer the CTD ICON bounding box (excludes the label),
		// which keeps the endpoint stable as the label reflows on narrow screens.
		const tRect = (ctdIcon ? ctdIcon.getBoundingClientRect() : ctd.getBoundingClientRect());
		const mRect = magnifierRef.current?.getBoundingClientRect();

		// Start near boat bottom-right; End near CTD (adjustable offsets)
		const startX = bRect.left + bRect.width * 0.70 - cRect.left;
		const startY = bRect.bottom - cRect.top;
		const END_OFFSET_X_PX = 16; // absolute px shift (negative = left)
		const END_OFFSET_X_FRAC = 0.15; // shift by a fraction of CTD width to the left
		const END_OFFSET_Y_PX = 18; // absolute px shift up/down
		const ctdCenterX = tRect.left + tRect.width * 0.5;
		const endX = ctdCenterX - tRect.width * END_OFFSET_X_FRAC - cRect.left + END_OFFSET_X_PX;
		const endY = tRect.top - cRect.top + tRect.height * 0.05 + END_OFFSET_Y_PX;

		const dx = endX - startX;
		const dy = endY - startY;
		// Make the line much straighter - more like a vertical drop
		const c1x = startX + dx * 0.1; // Very slight horizontal movement
		const c1y = startY + dy * 0.3; // More vertical movement
		const c2x = startX + dx * 0.9; // Very slight horizontal movement
		const c2y = endY - dy * 0.1; // More vertical movement

		setSvgSize({ w: cRect.width, h: cRect.height });
		setConnectorD(`M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`);
	};

	useEffect(() => {
		computeConnector();
	}, []);

	useEffect(() => {
		const ro = new ResizeObserver(() => computeConnector());
		if (containerRef.current) ro.observe(containerRef.current);
		if (boatRef.current) ro.observe(boatRef.current);
		if (ctdRef.current) ro.observe(ctdRef.current);
		if (ctdIconRef.current) ro.observe(ctdIconRef.current);
		window.addEventListener("resize", computeConnector);
		return () => {
			window.removeEventListener("resize", computeConnector);
			ro.disconnect();
		};
	}, []);

	return (
		<div ref={containerRef} className="relative w-full h-full">

			{/* Boat (Project) at surface - outline style, shifted left */}
			<div ref={boatRef} className="absolute top-9 left-[30%] -translate-x-1/2 flex items-center gap-4 z-10">
				<div className="text-primary">
					<svg viewBox="0 0 423.43 168.09" className="h-35 w-auto" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
						<path d="M177.09,96.19c.85-1.5,18.16-54.31,18.16-54.31,0,0,6.1-3.1,18.75.15,10.81,2.79,15.96,6.24,15.96,6.24l-4.8,56.13"/>
						<path d="M419.8,119.51c-9.19-16.33-18.31-33.36-26.1-48.55-3.79-7.5-9.88-13.32-14.73-12.97-4.36.3-7.5,1.5-6.88,8.88,1.39,18,4.96,36.3,7.18,54.46.79,9.21,13.18,17.35,26.31,14.76,12.88-2.56,19-9.18,14.22-16.57h0ZM404.97,133.68c-9,2.17-18.1-5.08-19.09-13.15-2.39-16-4.89-31.95-7.5-47.85-1.27-8.13.66-8.88,3.99-9.37,3.33-.49,5.49,4.77,8.65,11.34,7.21,15,15.61,31.62,22.5,45,3.61,6.54.28,11.91-8.55,14.04h0Z"/>
						<polygon points="419.95 111.83 405.39 111.83 404.99 106.55 383.6 106.55 383.6 125.67 397.62 125.67 406.46 125.67 423.37 120.09 419.95 111.83"/>
						<path d="M330.5,119.7s-1.42-18.54-22.81-18.54c-19.69,0-33.31,2.41-37.5-2.4-6.94-7.87-19.36-6.09-19.36-6.09h-74.21v-28.29h-28.36l-11.43-7.5-37.75,7.8,5.79,8.73v19.26H1.5l27.82,27h0l50.17,48.3h325.48s5.79-6.69,11.13-20.77c3.29-8.79,5.75-17.88,7.33-27.13l-92.93-.36Z"/>
						<path d="M173.43,2.11c-2.61,11.17-5.53,22.27-8.47,33.39l-4.5,16.62-2.29,8.29c-.84,2.76-1.14,5.62-3.51,8.02l-1.75-.42c-.79-3.13.48-5.79,1.2-8.56l2.34-8.26,4.86-16.5c3.36-11.01,6.7-22,10.38-33l1.75.42Z"/>
						<path d="M276.54,35.11l-1.18-1.38c.56-1.48.85-3.05.85-4.63.05-7.21-5.75-13.09-12.96-13.14-7.21-.05-13.09,5.75-13.14,12.96-.01,1.65.29,3.28.88,4.81l-1.2,1.38,10.23,11.86v54h6.3v-54l10.21-11.86h0Z"/>
					</svg>
				</div>
				<span className="text-base-content/90 text-lg">Project</span>
			</div>

			{/* Responsive connector from boat to CTD */}
			{connectorD && (
				<svg className="absolute inset-0 pointer-events-none text-primary z-30" viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}>
					<path d={connectorD} stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.7" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
				</svg>
			)}

			{/* CTD on the right under the boat */}
			<div ref={ctdRef} className="absolute top-[15rem] left-[65%] -translate-x-1/2 flex flex-row items-center gap-3">
				<div className="text-primary">
					<div id="ctd-target" ref={ctdIconRef} role="img" aria-label="CTD" style={{width:'8rem',height:'14rem',backgroundColor:'currentColor',WebkitMaskImage:'url(/images/icons/ctd_icon.svg)',maskImage:'url(/images/icons/ctd_icon.svg)',WebkitMaskRepeat:'no-repeat',maskRepeat:'no-repeat',WebkitMaskPosition:'center',maskPosition:'center',WebkitMaskSize:'contain',maskSize:'contain', transform: 'rotate(356deg)'}} />
				</div>
				<span className="text-base-content/80 text-lg">Sample Collection</span>
			</div>

			{/* Magnifying Glass at bottom left of CTD - small, blue primary, subtle flash */}
			<button
				onClick={handleMagnifyingGlassClick}
				ref={magnifierRef}
				className="absolute flex items-center justify-center text-primary cursor-pointer z-20 animate-pulse"
				aria-label="Zoom to Sample"
				style={{ 
					animationDuration: '3s', 
					animationIterationCount: 'infinite',
					top: 'calc(15rem + 14rem - 2rem)', // CTD top + height - offset
					left: 'calc(55% - 6rem)' // CTD left - offset
				}}
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12">
					<path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
				</svg>
			</button>
		</div>
	);
};

export default ProjectViz;