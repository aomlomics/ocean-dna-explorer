import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/app/helpers/prisma";

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

async function getPhylaByKingdom(kingdom: string, take: number = 10): Promise<PhylumData[]> {
	const taxonomiesInKingdom = await prisma.taxonomy.findMany({
		where: { kingdom: kingdom },
		select: { taxonomy: true, phylum: true }
	});

	const taxonomyMap = new Map(taxonomiesInKingdom.map((t) => [t.taxonomy, t.phylum]));
	const taxonomyStrings = Array.from(taxonomyMap.keys());

	const phylaData = await prisma.assignment.groupBy({
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
				"Including the plants and animals we recognize, eukaryotes are defined by complex, nucleated cells. They span everything from microscopic algae and corals to fish and whales. They represent the ocean’s visible biodiversity, making up the familiar life found across the ocean (and land).",
			image: "/images/bait_ball.jpeg",
			phyla: eukaryotaPhyla
		},
		{
			kingdom: "Bacteria",
			title: "Bacteria",
			description:
				"As the ocean's most abundant single-celled life, these microbes are the primary drivers of global nutrient cycles. They break down organic matter to recycle essential elements, sustaining the entire marine food web from the bottom up, as well as maintaining the chemical health of the water.",
			image: "/images/bacteria_image.jpeg",
			phyla: bacteriaPhyla
		},
		{
			kingdom: "Archaea",
			title: "Archaea",
			description:
				"Evolutionarily distinct from bacteria, these resilient microbes thrive in harsh environments where nothing else can. By dominating deep-sea hydrothermal vents, they play a critical role in regulating the ocean’s unique methane balances and provide a window into the planet’s earliest biological history.",
			image: "/images/hydrothermal_vent.jpg",
			phyla: archaeaPhyla
		}
	];

	const hasData = kingdomSections.some((section) => section.phyla.length > 0);

	if (!hasData) {
		return (
			<div className="bg-transparent rounded-lg p-6 flex items-center justify-center text-base-content/70">
				No taxonomy data available yet.
			</div>
		);
	}

	return (
		<div className="space-y-6 w-full max-w-6xl mx-auto">
			{/* Title */}
			<div className="text-2xl text-base-content px-2 md:px-4">
				<span className="text-primary mr-1">Life across the</span>
				<span>Ocean DNA Explorer</span>
			</div>

			{/* Three Kingdom Columns */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:px-4">
				{kingdomSections.map((section) => (
					<div
						key={section.kingdom}
						className="rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
					>
						{/* Image Container */}
						<div className="relative h-56 w-full overflow-hidden shrink-0">
							<Image
								src={section.image}
								alt={section.kingdom}
								fill
								className="object-cover opacity-85"
								sizes="(max-width: 768px) 100vw, 33vw"
							/>
						</div>

						{/* Content Container */}
						<div className="p-6 space-y-3 flex flex-col grow">
							{/* Kingdom Title */}
							<div>
								<h3 className="text-lg font-semibold text-base-content">{section.title}</h3>
								<p className="text-sm text-base-content/80 leading-relaxed mt-1">{section.description}</p>
							</div>

							{/* Phyla List - Fixed height for alignment */}
							<div className="grow flex flex-col">
								{section.phyla.length > 0 ? (
									<>
										<p className="text-xs font-semibold text-base-content/70 mt-4 mb-4 uppercase tracking-wider">
											Top Phyla
										</p>
										<div className="space-y-1 mt-2">
											{section.phyla.map((phylumData, index) => (
												<Link
													key={phylumData.phylum}
													href={`/explore/taxonomy?phylum=${encodeURIComponent(phylumData.phylum)}`}
													className="flex items-center justify-between text-sm hover:bg-base-300/20 px-2 py-1 rounded transition-colors cursor-pointer group"
												>
													<div className="flex items-center gap-2 min-w-0 flex-1">
														<span className="text-primary font-semibold shrink-0 group-hover:text-primary/80">
															{index + 1}.
														</span>
														<span className="text-base-content group-hover:text-primary truncate group-hover:underline">
															{phylumData.phylum}
														</span>
													</div>
													<span className="text-primary shrink-0 ml-2 font-medium group-hover:text-primary/80">
														{phylumData.count.toLocaleString()}
													</span>
												</Link>
											))}
										</div>
									</>
								) : (
									<p className="text-sm text-base-content/60 italic">No data available</p>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
