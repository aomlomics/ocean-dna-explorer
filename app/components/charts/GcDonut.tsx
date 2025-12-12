"use client";
import React from "react";

type GcDonutProps = {
	percentage: number;
	size?: number;
	strokeWidth?: number;
};

const GcDonut = ({ percentage, size = 80, strokeWidth = 10 }: GcDonutProps) => {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (percentage / 100) * circumference;

	return (
		<div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					className="stroke-base-300"
					strokeWidth={strokeWidth}
					fill="transparent"
					r={radius}
					cx={size / 2}
					cy={size / 2}
				/>
				<circle
					className="stroke-primary"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
					fill="transparent"
					r={radius}
					cx={size / 2}
					cy={size / 2}
					style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
				/>
			</svg>
			<span className="absolute text-sm font-bold text-base-content">{`${percentage.toFixed(1)}%`}</span>
		</div>
	);
};

export default GcDonut;
