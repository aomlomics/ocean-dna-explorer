"use client";

import { useState } from "react";
import ThemeAwarePhyloPic from "@/app/components/images/ThemeAwarePhyloPic";

interface AssayPhyloPicImageProps {
	src: string;
}

export default function AssayPhyloPicImage({ src }: AssayPhyloPicImageProps) {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div className="w-full h-full relative">
			{isLoading ? (
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="loading loading-spinner loading-sm text-blue-500" />
				</div>
			) : null}
			<ThemeAwarePhyloPic
				src={src}
				alt="Image of taxonomy"
				onLoad={() => setIsLoading(false)}
				onError={() => setIsLoading(false)}
				className={`object-contain transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
			/>
		</div>
	);
}
