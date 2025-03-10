"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

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

export default function Carousel() {
	const [carouselActiveItem, setCarouselActiveItem] = useState(0);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
		const play = setInterval(() => {
			let nextItem;
			do {
				nextItem = Math.floor(Math.random() * carouselImgSrc.length);
			} while (nextItem === carouselActiveItem); // Ensure we don't show the same image twice
			setCarouselActiveItem(nextItem);
		}, 11000); // how much time between image changes (11 seconds)
		return () => clearInterval(play);
	}, [carouselActiveItem]);

	if (!isMounted) {
		return (
			<div className="relative w-full h-full">
				<div className="absolute inset-0">
					<Image src={carouselImgSrc[0]} alt="Carousel image 1" fill className="object-cover" priority />
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full">
			{carouselImgSrc.map((imgSrc, index) => (
				<div
					key={imgSrc}
					className={`absolute inset-0 transition-opacity duration-[2000ms] ${
						// transition animation duration
						index === carouselActiveItem ? "opacity-100" : "opacity-0"
					}`}
				>
					<Image
						src={imgSrc}
						alt={`Carousel image ${index + 1}`}
						fill
						className="object-cover"
						priority={index === carouselActiveItem}
					/>
				</div>
			))}
		</div>
	);
}
