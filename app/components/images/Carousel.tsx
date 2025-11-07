"use client";

import { Image as DbImage } from "@/app/generated/prismaImages/client";
import { Attribution } from "@/prismaImages/generated/zod";
import Image from "next/image";
import AttributionBadge from "./AttributionBadge";
import { useEffect, useState } from "react";

export default function Carousel({ images }: { images: (DbImage & { Attribution?: Attribution | null })[] }) {
	const [currIndex, setCurrIndex] = useState(0);

	useEffect(() => {
		if (images.length <= 1) {
			return;
		}

		const timer = setTimeout(() => {
			setCurrIndex(currIndex === images.length - 1 ? 0 : currIndex + 1);
		}, 10000);

		return () => clearTimeout(timer);
	}, [currIndex]);

	return (
		<div className="absolute inset-0 overflow-hidden bg-base-100">
			{images[currIndex] ? (
				<>
					<div
						key={images[currIndex].url}
						className="absolute inset-0 opacity-0 animate-[fade-in-out_10s_ease-in-out]"
						style={{
							WebkitMaskImage: "radial-gradient(ellipse 75% 75% at 80% 35%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 85%)",
							maskImage: "radial-gradient(ellipse 80% 75% at 80% 40%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 85%)" // 1st% inner ellipse gradient strength.
						}}
					>
						<Image
							src={images[currIndex].url}
							alt={images[currIndex].description || "A background image"}
							fill
							className="object-cover opacity-50 [html[data-theme='dark']_&]:opacity-70"
							priority
						/>
					</div>
					<AttributionBadge image={images[currIndex]} />
				</>
			) : (
				<></>
			)}
		</div>
	);
}
