"use client";

import type { ImageModel } from "@/app/generated/prismaImages/models/Image";
import { useState } from "react";

export default function AttributionBadge({
	image
}: {
	image:
		| (ImageModel & {
				Attribution?: {
					attributionTitle: string;
					attributionUrl?: string | null;
					attributionInstitution?: string | null;
				} | null;
		  })
		| null;
}) {
	const [hover, setHover] = useState(false);
	if (!image) return null;
	const attr = image.Attribution || null;

	return (
		<div
			className="absolute right-4 bottom-24 sm:right-6 sm:bottom-28 z-60"
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			<div className="relative">
				{/* Circular chip with masked SVG colored by bg-primary */}
				<div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-base-100/70 border border-base-200 backdrop-blur flex items-center justify-center shadow-sm">
					<span className="block w-5 h-5 bg-primary [mask-image:url('/images/icons/photo_icon.svg')] mask-contain mask-no-repeat mask-center [-webkit-mask-image:url('/images/icons/photo_icon.svg')] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]"></span>
				</div>

				{hover && (
					<div className="absolute bottom-full right-0 mt-2 p-3 rounded-lg shadow-lg bg-base-100/90 backdrop-blur text-base-content max-w-[85vw] sm:max-w-sm w-72 border border-base-200">
						<div className="text-xs sm:text-sm space-y-0.5 wrap-break-word">
							<p className="font-semibold text-base-content truncate" title={image.name}>
								{image.name}
							</p>
							{attr && (
								<p>
									<span className="text-base-content/70">Attribution:</span>{" "}
									<span className="text-base-content font-medium">{attr.attributionTitle}</span>
								</p>
							)}
							{attr?.attributionInstitution && (
								<p>
									<span className="text-base-content/70">Institution:</span>{" "}
									<span className="text-base-content">{attr.attributionInstitution}</span>
								</p>
							)}
							{attr?.attributionUrl && (
								<p className="opacity-90 break-all">
									<span className="text-base-content/70">URL:</span>{" "}
									<a className="link" href={attr.attributionUrl} target="_blank" rel="noreferrer">
										{attr.attributionUrl}
									</a>
								</p>
							)}
							{image.location && (
								<p>
									<span className="text-base-content/70">Location:</span>{" "}
									<span className="text-base-content">{image.location}</span>
								</p>
							)}
							{image.dateTaken && (
								<p>
									<span className="text-base-content/70">Taken:</span>{" "}
									<span className="text-base-content">{new Date(image.dateTaken).toLocaleDateString()}</span>
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
