import Image from "next/image";
import Link from "next/link";
import { publicPrisma } from "@/app/helpers/prisma";
import ThemeAwareSvg from "@/app/components/help/ThemeAwareSvg";

type PhylumData = {
	phylum: string;
	count: number;
};

type KingdomSection = {
	kingdom: string;
	title: string;
	description: string;
	image: string;
	phyla: PhylumData[];
};

async function getPhylaByKingdom(kingdom: string, take: number = 8): Promise<PhylumData[]> {
	const taxonomiesInKingdom = await publicPrisma.taxonomy.findMany({
		where: { kingdom: kingdom },
		select: { taxonomy: true, phylum: true }
	});

	const taxonomyMap = new Map(taxonomiesInKingdom.map((t) => [t.taxonomy, t.phylum]));
	const taxonomyStrings = Array.from(taxonomyMap.keys());

	const phylaData = await publicPrisma.assignment.groupBy({
		by: ["taxonomy"],
		where: {
			taxonomy: { in: taxonomyStrings }
		},
		_count: { taxonomy: true },
		orderBy: { _count: { taxonomy: "desc" } },
		take: 1000
	});

	const phylumMap = new Map<string, number>();

	for (const row of phylaData) {
		const phylum = taxonomyMap.get(row.taxonomy);
		if (phylum) {
			phylumMap.set(phylum, (phylumMap.get(phylum) ?? 0) + row._count.taxonomy);
		}
	}

	return Array.from(phylumMap.entries())
		.map(([phylum, count]) => ({ phylum, count }))
		.sort((a, b) => b.count - a.count)
		.filter((item) => item.count > 0)
		.slice(0, take);
}

export default async function TopTaxonomiesSummary() {
	//TODO: rework this to not use promise.all
	const [eukaryotaPhyla, bacteriaPhyla, archaeaPhyla] = await Promise.all([
		getPhylaByKingdom("Eukaryota"),
		getPhylaByKingdom("Bacteria"),
		getPhylaByKingdom("Archaea")
	]);

	const kingdomSections: KingdomSection[] = [
		{
			kingdom: "Eukaryota",
			title: "Eukaryota",
			description:
				"Complex, nucleated cells spanning microscopic algae and corals to fish and whales. Represents the ocean's visible biodiversity.",
			image: "/images/bait_ball.jpeg",
			phyla: eukaryotaPhyla
		},
		{
			kingdom: "Bacteria",
			title: "Bacteria",
			description:
				"The ocean's most abundant single-celled life. Primary drivers of global nutrient cycles and the marine food web from the bottom up.",
			image: "/images/bacteria_image.jpeg",
			phyla: bacteriaPhyla
		},
		{
			kingdom: "Archaea",
			title: "Archaea",
			description:
				"Evolutionarily distinct microbes that thrive in harsh environments; critical for regulating ocean methane and early biological history.",
			image: "/images/hydrothermal_vent.jpg",
			phyla: archaeaPhyla
		}
	];

	const hasData = kingdomSections.some((section) => section.phyla.length > 0);

	if (!hasData) {
		return (
			<div
				className={[
					"rounded-2xl bg-base-200 p-8",
					"shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_6px_18px_-12px_rgba(0,0,0,0.45)]",
					"flex items-center justify-center text-base-content/70"
				].join(" ")}
			>
				No taxonomy data available yet.
			</div>
		);
	}

	return (
		<section className="space-y-6">
			<h2 className="text-2xl sm:text-3xl font-semibold text-base-content leading-tight">Life Across ODE</h2>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
				{kingdomSections.map((section) => (
					<KingdomCard key={section.kingdom} section={section} />
				))}
			</div>
		</section>
	);
}

function KingdomCard({ section }: { section: KingdomSection }) {
	return (
		<div
			className={[
				"relative flex flex-col overflow-hidden rounded-2xl h-full",
				// Solid card background — same shell language as DashCard so
				// Life Across ODE reads as part of the same dashboard family.
				"bg-base-200",
				"shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_6px_18px_-12px_rgba(0,0,0,0.45),0_1px_3px_-1px_rgba(0,0,0,0.18)]",
				"hover:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_10px_24px_-14px_rgba(0,0,0,0.5),0_2px_5px_-1px_rgba(0,0,0,0.22)]",
				"transition-shadow duration-300"
			].join(" ")}
		>
			<div className="relative h-44 w-full overflow-hidden">
				{section.kingdom === "Bacteria" ? (
					<ThemeAwareSvg
						lightSrc="/images/bacteria_image.jpeg"
						darkSrc="/images/bacteria_image_dark.png"
						alt={section.kingdom}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, 33vw"
						priority={false}
					/>
				) : (
					<Image
						src={section.image}
						alt={section.kingdom}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, 33vw"
					/>
				)}
				{/*
				 * Faded gradient so the image softly bleeds into the card
				 * body rather than ending on a hard horizontal line.
				 * Fade target is base-200 (the card color) so the fade blends
				 * perfectly with the body below.
				 */}
				<div className="absolute inset-0 pointer-events-none bg-linear-to-b from-transparent to-base-200" aria-hidden />
				<div className="absolute bottom-3 left-4 right-4 z-1">
					<h3 className="text-2xl font-semibold leading-tight drop-shadow-sm text-white [html[data-theme='dark']_&]:text-base-content">
						{section.title}
					</h3>
				</div>
			</div>

			<div className="p-5 flex flex-col gap-4 grow">
				<p className="text-sm text-base-content/70 leading-relaxed">{section.description}</p>

				<div>
					<div className="flex items-center justify-between mb-2.5">
						<p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-base-content/55">Top phyla</p>
						<span className="text-[11px] text-base-content/50">Count</span>
					</div>
					<ul className="divide-y divide-base-content/5">
						{section.phyla.length > 0 ? (
							section.phyla.map((p, idx) => (
								<li key={p.phylum}>
									<Link
										href={`/explore/taxonomy?phylum=${encodeURIComponent(p.phylum)}`}
										className="flex items-center justify-between text-sm px-1 py-1.5 rounded-md hover:bg-base-200/40 transition-colors group"
									>
										<span className="flex items-center gap-2 min-w-0">
											<span className="text-primary/80 font-semibold shrink-0 text-xs w-4 text-right tabular-nums">
												{idx + 1}
											</span>
											<span className="text-base-content truncate group-hover:text-primary transition-colors">
												{p.phylum}
											</span>
										</span>
										<span className="text-xs font-semibold text-base-content/70 tabular-nums ml-2">
											{p.count.toLocaleString()}
										</span>
									</Link>
								</li>
							))
						) : (
							<li className="text-sm text-base-content/60 italic px-2 py-1">No data available</li>
						)}
					</ul>
				</div>
			</div>
		</div>
	);
}
