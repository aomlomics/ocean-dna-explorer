"use client";

import { Image as DbImage } from "@/app/generated/prismaImages/client";
import { Attribution } from "@/prismaImages/generated/zod";
import Image from "next/image";
import AttributionBadge from "./AttributionBadge";
import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeNever() {
	return () => {};
}

function shuffleImages<T>(list: T[]): T[] {
	const copy = [...list];
	for (let i = copy.length - 1; i > 0; i--) {
		const randomIndex = Math.floor(Math.random() * i + 1);
		[copy[i], copy[randomIndex]] = [copy[randomIndex]!, copy[i]!];
	}
	return copy;
}

export default function Carousel({ images }: { images: (DbImage & { Attribution?: Attribution | null })[] }) {
	// Start with the server order so the first client paint matches SSR HTML.
	// Shuffle after mount; Math.random() during render would mismatch.
	const [shuffledImages, setShuffledImages] = useState(images);
	const [shuffleSource, setShuffleSource] = useState(images);
	const [hasClientShuffle, setHasClientShuffle] = useState(false);
	const [currIndex, setCurrIndex] = useState(0);
	const mounted = useSyncExternalStore(
		subscribeNever,
		() => true,
		() => false
	);

	if (mounted && (!hasClientShuffle || shuffleSource !== images)) {
		setHasClientShuffle(true);
		setShuffleSource(images);
		setShuffledImages(shuffleImages(images));
	}

	useEffect(() => {
		if (shuffledImages.length <= 1) {
			return;
		}

		const timer = setTimeout(() => {
			setCurrIndex(currIndex === shuffledImages.length - 1 ? 0 : currIndex + 1);
		}, 10000);

		return () => clearTimeout(timer);
	}, [currIndex]);

	return (
		<div className="absolute inset-0 overflow-hidden bg-base-100">
			{shuffledImages[currIndex] ? (
				<>
					<div
						key={shuffledImages[currIndex].url}
						className="absolute inset-0 opacity-0 animate-[fade-in-out_10s_ease-in-out]"
						style={{
							WebkitMaskImage: "radial-gradient(ellipse 75% 75% at 80% 35%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 85%)",
							maskImage: "radial-gradient(ellipse 80% 75% at 80% 40%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 85%)" // 1st% inner ellipse gradient strength.
						}}
					>
						<Image
							src={shuffledImages[currIndex].url}
							alt={shuffledImages[currIndex].description || "A background image"}
							fill
							className="object-cover opacity-50 [html[data-theme='dark']_&]:opacity-70"
							priority
						/>
					</div>
					<AttributionBadge image={shuffledImages[currIndex]} />
				</>
			) : (
				<></>
			)}
		</div>
	);
}
