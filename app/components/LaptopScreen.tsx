"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";

export interface LaptopScreenBounds {
	top: number;
	left: number;
	right: number;
	bottom: number;
}

const DEFAULT_SCREEN_BOUNDS: LaptopScreenBounds = {
	top: 10,
	left: 15.5,
	right: 15.5,
	bottom: 40
};

/** Fixed size we design content for; scale factor is computed so this fits the measured screen. */
export const CONTENT_REFERENCE_WIDTH = 320;
export const CONTENT_REFERENCE_HEIGHT = 220;

export interface LaptopScreenProps {
	children: React.ReactNode;
	className?: string;
	screenBounds?: LaptopScreenBounds;
	alt?: string;
}

/**
 * Laptop frame with a screen area. Measures the screen overlay in pixels (ResizeObserver),
 * then renders children inside a fixed-size content area scaled to fit. Content looks
 * the same at every laptop size—no overflow, no scrollbar.
 */
export default function LaptopScreen({
	children,
	className = "",
	screenBounds = DEFAULT_SCREEN_BOUNDS,
	alt = "Laptop"
}: LaptopScreenProps) {
	const screenRef = useRef<HTMLDivElement>(null);
	const [screenSize, setScreenSize] = useState({ w: 0, h: 0 });

	useEffect(() => {
		const el = screenRef.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			const { width, height } = entries[0].contentRect;
			setScreenSize({ w: width, h: height });
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const scale =
		screenSize.w > 0 && screenSize.h > 0
			? Math.min(screenSize.w / CONTENT_REFERENCE_WIDTH, screenSize.h / CONTENT_REFERENCE_HEIGHT)
			: 1;

	return (
		<div
			className={`relative w-full h-full min-w-0 min-h-0 flex items-center justify-center ${className}`}
		>
			<div
				className="relative w-full h-full max-w-full max-h-full min-h-0"
				style={{ aspectRatio: "1320 / 1080" }}
			>
				<Image
					src="/images/biorender/laptop.png"
					alt={alt}
					fill
					sizes="(max-width: 1024px) 100vw, 50vw"
					className="object-contain"
					priority
				/>

				{/* Screen overlay: measured in px; content scaled to fit and centered */}
				<div
					ref={screenRef}
					className="absolute overflow-hidden"
					style={{
						top: `${screenBounds.top}%`,
						left: `${screenBounds.left}%`,
						right: `${screenBounds.right}%`,
						bottom: `${screenBounds.bottom}%`
					}}
				>
					{/* Fixed-size content area; scale(scale) fits measured screen; translate centers it */}
					<div
						className="absolute left-1/2 top-1/2 origin-center flex flex-col items-center justify-center text-center"
						style={{
							width: CONTENT_REFERENCE_WIDTH,
							height: CONTENT_REFERENCE_HEIGHT,
							transform: `translate(-50%, -50%) scale(${scale})`,
							padding: "5%"
						}}
					>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
