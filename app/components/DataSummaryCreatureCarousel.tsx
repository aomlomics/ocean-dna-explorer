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
	/** IUCN Red List short code (LC, NT, VU, EN, CR, EW, EX, DD, NE). */
	iucnStatus?: string;
};

type Props = {
	creatures: FeaturedCreature[];
};

// IUCN Red List category display info. We keep the data field as the short
// code (LC, EN, ...) so it's easy to source from a DB later, but display the
// full wording for readability.
const IUCN_INFO: Record<string, { label: string; className: string }> = {
	LC: { label: "Least Concern", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
	NT: { label: "Near Threatened", className: "bg-lime-500/10 text-lime-600 border-lime-500/20" },
	VU: { label: "Vulnerable", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
	EN: { label: "Endangered", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
	CR: { label: "Critically Endangered", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
	EW: { label: "Extinct in the Wild", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
	EX: { label: "Extinct", className: "bg-base-content/10 text-base-content/70 border-base-content/20" },
	DD: { label: "Data Deficient", className: "bg-base-content/10 text-base-content/60 border-base-content/15" },
	NE: { label: "Not Evaluated", className: "bg-base-content/10 text-base-content/60 border-base-content/15" }
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
					className="flex transition-transform duration-500 ease-out"
					style={{ transform: `translateX(-${activeSlide * 100}%)` }}
				>
					{slides.map((slide, index) => (
						<div key={`slide-${index + 1}`} className="w-full shrink-0">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
								{slide.map((creature) => (
									<CreatureCard key={creature.id} creature={creature} />
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Controls: chevrons inline next to the indicator dots, primary blue, no circles */}
			<div className="flex items-center justify-center gap-4 mt-6">
				<button
					type="button"
					onClick={goPrev}
					className="inline-flex items-center justify-center text-primary hover:text-primary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1"
					aria-label="Previous featured organisms"
				>
					<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
						<path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
					</svg>
				</button>
				<div className="flex items-center gap-2" role="tablist" aria-label="Featured organism slides">
					{slides.map((_, i) => (
						<button
							key={`creature-bullet-${i + 1}`}
							type="button"
							onClick={() => setActiveSlide(i)}
							className={[
								"h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100",
								activeSlide === i ? "bg-primary w-6" : "bg-base-content/20 hover:bg-base-content/40 w-2"
							].join(" ")}
							aria-label={`Jump to featured organism slide ${i + 1}`}
							aria-current={activeSlide === i ? "true" : undefined}
						/>
					))}
				</div>
				<button
					type="button"
					onClick={goNext}
					className="inline-flex items-center justify-center text-primary hover:text-primary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1"
					aria-label="Next featured organisms"
				>
					<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
						<path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
					</svg>
				</button>
			</div>
		</div>
	);
}

function CreatureCard({ creature }: { creature: FeaturedCreature }) {
	const iucn = creature.iucnStatus ? IUCN_INFO[creature.iucnStatus] : null;

	return (
		<div
			className={[
				"relative flex flex-col overflow-hidden rounded-2xl h-full",
				// Solid base-200 to match DashCard / KingdomCard
				"bg-base-200",
				"shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_6px_18px_-12px_rgba(0,0,0,0.45),0_1px_3px_-1px_rgba(0,0,0,0.18)]",
				"hover:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_10px_24px_-14px_rgba(0,0,0,0.5),0_2px_5px_-1px_rgba(0,0,0,0.22)]",
				"transition-shadow duration-300"
			].join(" ")}
		>
			<figure className="relative h-48 sm:h-52 w-full overflow-hidden">
				{creature.imageSrc ? (
					<Image
						src={creature.imageSrc}
						alt={`${creature.commonName} feature image`}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, 33vw"
					/>
				) : (
					<div
						className="absolute inset-0 flex items-center justify-center"
						style={{
							background:
								"radial-gradient(circle at 25% 25%, rgba(125,186,229,0.35), transparent 55%), radial-gradient(circle at 75% 80%, rgba(35,61,127,0.5), transparent 60%), linear-gradient(135deg, #0f1a33 0%, #1a2f63 100%)"
						}}
					>
						<svg className="w-14 h-14 text-primary/50" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M12 6c3.5 0 6 2 8 5-2 3-4.5 5-8 5s-6-2-8-5c2-3 4.5-5 8-5zm0 2.5A2.5 2.5 0 1012 13a2.5 2.5 0 000-4.5z" />
						</svg>
					</div>
				)}
				{/*
				 * Fade the image down into the card body so it doesn't end on
				 * a hard horizontal edge. Fade target is base-200 (card color).
				 */}
				<div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-base-200 via-base-200/70 to-transparent" />
			</figure>

			<div className="p-5 flex flex-col gap-2.5 grow">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/70">
						{creature.rank}
					</span>
					{iucn && (
						<span
							className={[
								"inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
								iucn.className
							].join(" ")}
							title="IUCN Red List status"
						>
							<span className="opacity-70 font-semibold tracking-wider">IUCN</span>
							<span aria-hidden="true" className="opacity-40">·</span>
							<span>{iucn.label}</span>
						</span>
					)}
				</div>
				<h4 className="text-lg font-semibold text-base-content leading-tight italic">{creature.taxonomyName}</h4>
				<p className="text-sm text-base-content/80 leading-snug">{creature.commonName}</p>
				<p className="text-sm text-base-content/65 leading-relaxed line-clamp-3">{creature.description}</p>
				<div className="mt-auto pt-3 flex justify-end">
					<Link
						href={creature.taxonomyHref}
						className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
					>
						View taxonomy
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
						</svg>
					</Link>
				</div>
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
