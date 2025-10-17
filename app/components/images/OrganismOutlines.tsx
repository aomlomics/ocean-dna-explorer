"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/app/helpers/useMediaQuery";

const sizeMap = {
	sm: "w-32 h-32", // 128px
	md: "w-48 h-48", // 192px
	lg: "w-[24rem] h-[24rem]", // 384px
	xl: "w-[36rem] h-[36rem]" // 576px
};

type Size = keyof typeof sizeMap;

const predefinedLayout = [
	{ size: "xl", position: { top: "-10%", right: "3%" } },
	{ size: "lg", position: { top: "40%", left: "45%" } },
	{ size: "md", position: { top: "20%", right: "40%" } },
	{ size: "sm", position: { bottom: "5%", left: "70%" } },
	{ size: "sm", position: { top: "70%", left: "30%" } }, // under welcome text
	{ size: "sm", position: { bottom: "15%", right: "5%" } },
	{ size: "sm", position: { top: "8%", left: "40%" } }
];

const mobileLayout = [
	{ size: "md", position: { top: "5%", right: "5%" } },
	{ size: "sm", position: { bottom: "10%", left: "5%" } },
	{ size: "sm", position: { top: "30%", left: "15%" } }
];

export default function OrganismOutlines({ outlines }: { outlines: string[] }) {
	const [mounted, setMounted] = useState(false);
	const [organismData, setOrganismData] = useState<any[]>([]);
	const isMobile = useMediaQuery("(max-width: 768px)");

	useEffect(() => {
		setMounted(true);

		// Create a mutable copy of all outlines to be able to pull from it.
		const availableOutlines = [...outlines];

		const layout = (isMobile ? mobileLayout : predefinedLayout).map((item, index) => {
			// Find all available outlines that match the required size.
			const matchingOutlines = availableOutlines.filter((o) => o.startsWith(item.size));

			// If no outline of the required size is found, skip this layout slot.
			if (matchingOutlines.length === 0) return null;

			// Select a random outline from the matching ones.
			const randomIndex = Math.floor(Math.random() * matchingOutlines.length);
			const outline = matchingOutlines[randomIndex];

			// Remove the selected outline from the available pool to prevent reuse.
			const outlineIndexInAvailable = availableOutlines.findIndex((o) => o === outline);
			if (outlineIndexInAvailable !== -1) {
				availableOutlines.splice(outlineIndexInAvailable, 1);
			}

			const [size, name] = outline.split("_");
			return {
				src: `/images/outlines/${outline}`,
				alt: `${name.split(".")[0]} Outline`,
				className: `${sizeMap[size as Size]}`,
				style: {
					...item.position,
					animation: `fadeIn ${Math.random() * 1 + 1.5}s ease-in-out ${Math.random() * 1.5}s forwards`,
					opacity: 0
				}
			};
		});

		setOrganismData(layout.filter(Boolean));
	}, [outlines, isMobile]);

	if (!mounted) {
		return null;
	}

	return (
		<div className="absolute inset-0 w-full h-full overflow-hidden">
			{organismData.map((organism) => (
				<div key={organism.src} className={`absolute transform-gpu ${organism.className}`} style={organism.style}>
					<div className="relative w-full h-full animate-float">
						<Image
							src={organism.src}
							alt={organism.alt}
							fill
							className="object-contain transition-all duration-200 [html[data-theme='light']_&]:invert-0 [html[data-theme='dark']_&]:invert [html[data-theme='dark']_&]:brightness-[300]"
						/>
					</div>
				</div>
			))}
		</div>
	);
} 