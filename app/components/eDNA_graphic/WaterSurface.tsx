"use client";
import React, { useState, useEffect, useRef } from "react";

interface WaterSurfaceProps {
	className?: string;
}

const WaterSurface: React.FC<WaterSurfaceProps> = ({ className }) => {
	const [pathD, setPathD] = useState("");
	const svgRef = useRef<SVGSVGElement>(null);
	const pointsRef = useRef<any[]>([]);

	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;

		const numPoints = 10;
		const width = svg.clientWidth;
		const height = 40;
		const pointSpacing = width / (numPoints - 1);

		// Initialize points
		if (pointsRef.current.length === 0) {
			pointsRef.current = Array.from({ length: numPoints }, (_, i) => ({
				x: i * pointSpacing,
				y: height / 2,
				baseY: height / 2,
				vy: 0, // velocity
				targetY: height / 2
			}));
		}
		const points = pointsRef.current;

		let animationFrameId: number;

		const animate = () => {
			// Slightly gentler motion so the surface feels calm,
			// not choppy or distracting.
			const tension = 0.00025;
			const damping = 0.965;

			// Update points
			points.forEach((p) => {
				if (Math.random() > 0.9995) {
					p.targetY = p.baseY + (Math.random() - 0.25) * 4;
				}

				const dy = p.targetY - p.y;
				const ay = dy * tension;
				p.vy += ay;
				p.vy *= damping;
				p.y += p.vy;
			});

			// Create path
			let path = `M ${points[0].x} ${points[0].y}`;
			for (let i = 0; i < points.length - 1; i++) {
				const p1 = points[i];
				const p2 = points[i + 1];
				const midX = (p1.x + p2.x) / 2;
				path += ` C ${midX},${p1.y} ${midX},${p2.y} ${p2.x},${p2.y}`;
			}
			setPathD(path);

			animationFrameId = requestAnimationFrame(animate);
		};

		animationFrameId = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, []);

	return (
		<div className={className ?? "w-full my-12"}>
			<svg
				ref={svgRef}
				className="w-full h-10"
				viewBox="0 0 1000 40"
				preserveAspectRatio="none"
			>
				<path
					d={pathD}
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					className="text-primary"
				/>
			</svg>
		</div>
	);
};

export default WaterSurface;
