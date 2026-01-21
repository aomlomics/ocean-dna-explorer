"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

// function AnimatedWaterSurface() {
// 	const [pathD, setPathD] = useState("");
// 	const svgRef = useRef<SVGSVGElement | null>(null);
// 	const pointsRef = useRef<
// 		{
// 			x: number;
// 			y: number;
// 			baseY: number;
// 			vy: number;
// 			targetY: number;
// 		}[]
// 	>([]);

// 	useEffect(() => {
// 		const svg = svgRef.current;
// 		if (!svg) return;

// 		const numPoints = 10;
// 		const width = svg.clientWidth || 1000;
// 		const height = 40;
// 		const pointSpacing = width / (numPoints - 1);

// 		if (pointsRef.current.length === 0) {
// 			pointsRef.current = Array.from({ length: numPoints }, (_, i) => ({
// 				x: i * pointSpacing,
// 				y: height / 2,
// 				baseY: height / 2,
// 				vy: 0,
// 				targetY: height / 2
// 			}));
// 		}

// 		const points = pointsRef.current;
// 		let animationFrameId: number;

// 		const animate = () => {
// 			// Match the calmer surface motion used in the eDNA graphic
// 			// so the waterline feels gentle instead of overly choppy.
// 			const tension = 0.00025;
// 			const damping = 0.965;

// 			points.forEach((p) => {
// 				// Rare, small perturbations keep a subtle sense of motion
// 				// without the surface looking stormy.
// 				if (Math.random() > 0.9995) {
// 					p.targetY = p.baseY + (Math.random() - 0.5) * 4;
// 				}

// 				const dy = p.targetY - p.y;
// 				const ay = dy * tension;
// 				p.vy += ay;
// 				p.vy *= damping;
// 				p.y += p.vy;
// 			});

// 			let path = `M ${points[0].x} ${points[0].y}`;
// 			for (let i = 0; i < points.length - 1; i++) {
// 				const p1 = points[i];
// 				const p2 = points[i + 1];
// 				const midX = (p1.x + p2.x) / 2;
// 				path += ` C ${midX},${p1.y} ${midX},${p2.y} ${p2.x},${p2.y}`;
// 			}
// 			setPathD(path);

// 			animationFrameId = requestAnimationFrame(animate);
// 		};

// 		animationFrameId = requestAnimationFrame(animate);

// 		return () => cancelAnimationFrame(animationFrameId);
// 	}, []);

// 	return (
// 		<svg
// 			ref={svgRef}
// 			className="w-full h-10"
// 			viewBox="0 0 1000 40"
// 			preserveAspectRatio="none"
// 		>
// 			<path
// 				d={pathD}
// 				fill="none"
// 				stroke="currentColor"
// 				strokeWidth={2}
// 				className="text-primary"
// 			/>
// 		</svg>
// 	);
// }

const DataJourneySurfaceScene: React.FC = () => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const boatRef = useRef<HTMLDivElement | null>(null);
	const ctdRef = useRef<HTMLDivElement | null>(null);
	const ctdIconRef = useRef<HTMLDivElement | null>(null);

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
		const tRect = ctdIcon ? ctdIcon.getBoundingClientRect() : ctd.getBoundingClientRect();

		const startX = bRect.left + bRect.width * 0.7 - cRect.left;
		const startY = bRect.bottom - cRect.top;

		const END_OFFSET_X_PX = 16;
		const END_OFFSET_X_FRAC = 0.15;
		const END_OFFSET_Y_PX = 18;
		const ctdCenterX = tRect.left + tRect.width * 0.5;
		const endX = ctdCenterX - tRect.width * END_OFFSET_X_FRAC - cRect.left + END_OFFSET_X_PX;
		const endY = tRect.top - cRect.top + tRect.height * 0.05 + END_OFFSET_Y_PX;

		const dx = endX - startX;
		const dy = endY - startY;

		const c1x = startX + dx * 0.1;
		const c1y = startY + dy * 0.3;
		const c2x = startX + dx * 0.9;
		const c2y = endY - dy * 0.1;

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
		<div
			ref={containerRef}
			className="relative w-full h-full text-primary"
		>
		{/* Boat at surface */}
		<div
			ref={boatRef}
			className="absolute top-4 left-[34%] -translate-x-1/2 flex items-center z-10"
		>
			<div className="relative h-24 sm:h-28 md:h-32 lg:h-40 w-[220px] sm:w-[260px] md:w-[320px] lg:w-[380px]">
				<Image
					src="/images/biorender/ship_light_mode.png"
					alt="Research vessel"
					fill
					sizes="(max-width: 768px) 220px, (max-width: 1024px) 320px, 380px"
					className="object-contain [html[data-theme='dark']_&]:hidden"
					priority
				/>
				<Image
					src="/images/biorender/ship_dark_mode.png"
					alt="Research vessel"
					fill
					sizes="(max-width: 768px) 220px, (max-width: 1024px) 320px, 380px"
					className="object-contain hidden [html[data-theme='dark']_&]:block"
					priority
				/>
			</div>
		</div>

			{/* CTD below the vessel, shifted left with more vertical separation */}
			<div
				ref={ctdRef}
				className="absolute top-60 sm:top-64 md:top-72 lg:top-80 left-[30%] -translate-x-1/2 flex items-center"
			>
				<div
					ref={ctdIconRef}
					className="relative h-44 sm:h-52 md:h-60 lg:h-72 w-[90px] sm:w-[110px] md:w-[130px] lg:w-[150px]"
				>
					<Image
						src="/images/biorender/ctd_light_mode.png"
						alt="CTD instrument"
						fill
						sizes="(max-width: 768px) 90px, (max-width: 1024px) 130px, 150px"
						className="object-contain [html[data-theme='dark']_&]:hidden"
					/>
					<Image
						src="/images/biorender/ctd_dark_mode.png"
						alt="CTD instrument"
						fill
						sizes="(max-width: 768px) 90px, (max-width: 1024px) 130px, 150px"
						className="object-contain hidden [html[data-theme='dark']_&]:block"
					/>
				</div>
			</div>

			{/* Connector rope */}
			{connectorD && svgSize.w > 0 && svgSize.h > 0 && (
				<svg
					className="absolute inset-0 pointer-events-none text-primary"
					viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
					preserveAspectRatio="none"
				>
					<path
						d={connectorD}
						stroke="currentColor"
						strokeWidth={3}
						fill="none"
						strokeOpacity={0.7}
						vectorEffect="non-scaling-stroke"
						strokeLinecap="round"
					/>
				</svg>
			)}
		</div>
	);
};

export default DataJourneySurfaceScene;
