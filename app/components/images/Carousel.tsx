"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Image as DbImage } from "@/app/generated/prismaImages/client";
import AttributionBadge from "./AttributionBadge";

// Images with '_m' are images that are mirrored/flipped horizontally
// There are no other modifications to the images from NOAA Ocean Exploration
const carouselImgSrc = [
	`/images/carousel/bamboo_coral_m.jpg`,
	`/images/carousel/hydroid_medusa.jpg`,
	`/images/carousel/squid_m.jpg`,
	`/images/carousel/polar_bear_m.jpg`,
	`/images/carousel/school_of_fish.jpg`,
	// `/images/carousel/sculpin_on_coral_m.jpg`,
	`/images/carousel/adobe_copepod.jpeg`,
	`/images/carousel/adobe_jellyfish.jpeg`,
	`/images/carousel/bobtail_m.jpg`,
	`/images/carousel/chimaera.jpg`,
	`/images/carousel/fish_m.jpg`,
	`/images/carousel/hydroid.jpg`,
	`/images/carousel/pricklefish_m.jpg`,
	`/images/carousel/apr16_1_hires.jpg`,
	`/images/carousel/brain_coral.jpg`,
	`/images/carousel/coral_florida.jpg`,
	`/images/carousel/ex2206_dive03_medusa_hires.jpg`,
	`/images/carousel/jelly3_hires.jpg`,
	`/images/carousel/lancetfish.jpg`,
	`/images/carousel/silky_medusa_colobonema_sericeum.jpg`,
	`/images/carousel/siphonophore_800.jpg`
];

export default function Carousel({ images }: { images: (DbImage & { Attribution?: any })[] }) {
	const [isMounted, setIsMounted] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	// Convert DbImage[] to string[] for the carousel
	const safeImages = images.map(img => img.url || '');
	const mounted = isMounted;
	const intervalMs = 10000;
	const transitionMs = 1000;

	useEffect(() => setIsMounted(true), []);

	useEffect(() => {
		if (!mounted || safeImages.length <= 1) return;
		const id = setInterval(() => {
			setActiveIndex((prev) => {
				if (safeImages.length <= 1) return prev;
				let next = Math.floor(Math.random() * safeImages.length);
				if (next === prev) next = (prev + 1) % safeImages.length;
				return next;
			});
		}, intervalMs);
		return () => clearInterval(id);
	}, [mounted, safeImages, intervalMs]);

	const fallback = safeImages[0] ?? "/images/carousel/adobe_copepod.jpeg";
	const activeImage = mounted ? images[activeIndex] ?? null : null;

	return (
		<div className="absolute inset-0 overflow-hidden bg-base-100">
			{(mounted ? safeImages : [fallback]).map((src, index) => (
				<div
					key={`${src}-${index}`}
					className="absolute inset-0 transition-opacity"
					style={{
						opacity: mounted ? (index === activeIndex ? 1 : 0) : 1,
						transitionDuration: `${transitionMs}ms`,
						WebkitMaskImage: "radial-gradient(ellipse 75% 75% at 80% 35%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 85%)",
						maskImage: "radial-gradient(ellipse 80% 75% at 80% 40%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 85%)" // 1st% inner ellipse gradient strength. 
					}}
					aria-hidden={mounted ? index !== activeIndex : false}
				>
					<Image
						src={src}
						alt=""
						fill
						priority={mounted ? index === activeIndex : true}
						className="object-cover opacity-30 filter [html[data-theme='dark']_&]:opacity-55 [html[data-theme='dark']_&]:brightness-110 [html[data-theme='dark']_&]:contrast-110 [html[data-theme='dark']_&]:saturate-125"
						sizes="100vw"
					/>
				</div>
			))}
			<AttributionBadge image={activeImage as any} />
		</div>
	);
} 