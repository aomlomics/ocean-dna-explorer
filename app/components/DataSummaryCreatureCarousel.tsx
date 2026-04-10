"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type FeaturedCreature = {
	id: string;
	imageSrc?: string;
	rank: string;
	taxonomyName: string;
	commonName: string;
	description: string;
	taxonomyHref: string;
};

type Props = {
	creatures: FeaturedCreature[];
};

export default function DataSummaryCreatureCarousel({ creatures }: Props) {
	const slides = useMemo(() => chunkItems(creatures, 3), [creatures]);
	const [activeSlide, setActiveSlide] = useState(0);

	if (!slides.length) {
		return null;
	}

	const goPrev = () => setActiveSlide((current) => (current === 0 ? slides.length - 1 : current - 1));
	const goNext = () => setActiveSlide((current) => (current === slides.length - 1 ? 0 : current + 1));

	return (
		<div className="relative">
			<div className="overflow-hidden">
				<div
					className="flex transition-transform duration-300 ease-out"
					style={{ transform: `translateX(-${activeSlide * 100}%)` }}
				>
					{slides.map((slide, index) => (
						<div key={`slide-${index + 1}`} className="w-full shrink-0">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
								{slide.map((creature) => (
									<div key={creature.id} className="card bg-base-100 shadow-sm">
										<figure className="h-36 bg-base-200/80">
											{creature.imageSrc ? (
												<div className="relative w-full h-full">
													<Image
														src={creature.imageSrc}
														alt={`${creature.commonName} feature image`}
														fill
														className="object-cover"
														sizes="(max-width: 768px) 100vw, 25vw"
													/>
												</div>
											) : (
												<div className="w-full h-full flex items-center justify-center text-sm text-base-content/60">
													Image placeholder
												</div>
											)}
										</figure>
										<div className="card-body p-4 gap-2">
											<div className="flex items-center justify-between gap-2">
												<span className="text-xs font-medium text-base-content/70">{creature.rank}</span>
												<span className="text-xs text-base-content/60">Featured Taxon</span>
											</div>
											<h4 className="card-title text-base font-semibold leading-tight">{creature.taxonomyName}</h4>
											<p className="text-sm italic text-base-content/80">{creature.commonName}</p>
											<p className="text-sm text-base-content/75 line-clamp-3">{creature.description}</p>
											<div className="card-actions justify-end pt-1">
												<Link href={creature.taxonomyHref} className="btn btn-sm btn-primary">
													View taxonomy
												</Link>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="hidden md:flex justify-between items-center mt-4 px-1">
				<button
					type="button"
					onClick={goPrev}
					className="btn btn-ghost btn-sm text-xl text-base-content/70 hover:text-base-content"
					aria-label="Previous featured creatures"
				>
					❮
				</button>
				<button
					type="button"
					onClick={goNext}
					className="btn btn-ghost btn-sm text-xl text-base-content/70 hover:text-base-content"
					aria-label="Next featured creatures"
				>
					❯
				</button>
			</div>

			<div className="flex justify-center gap-2.5 mt-4" role="tablist" aria-label="Featured creature slides">
				{slides.map((_, i) => (
					<button
						key={`creature-bullet-${i + 1}`}
						type="button"
						onClick={() => setActiveSlide(i)}
						className={`h-2.5 w-2.5 rounded-full border-2 border-primary shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${
							activeSlide === i ? "bg-primary" : "bg-transparent"
						}`}
						aria-label={`Jump to creature feature slide ${i + 1}`}
						aria-current={activeSlide === i ? "true" : undefined}
					/>
				))}
			</div>
		</div>
	);
}

function chunkItems<T>(items: T[], chunkSize: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += chunkSize) {
		chunks.push(items.slice(i, i + chunkSize));
	}
	return chunks;
}
