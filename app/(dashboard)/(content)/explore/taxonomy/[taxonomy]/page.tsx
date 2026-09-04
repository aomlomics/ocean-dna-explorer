import { trustedPrisma } from "@/app/helpers/prisma";
import Map from "@/app/components/map/Map";
import Link from "next/link";
import { RanksBySpecificity, type TaxonomicRanks } from "@/types/objects";
import type { TaxonomyModel } from "@/app/generated/prisma/models/Taxonomy";
import { AnalysisIcon, ProjectIcon, LocationIcon } from "@/app/components/icons";
import ThemeAwarePhyloPic from "@/app/components/images/ThemeAwarePhyloPic";
import GbifIucnStatus from "@/app/components/images/GbifIucnStatus";
import { matchGbifForPhylopic } from "@/app/components/images/matchGbifForPhylopic";
import TaxonomyVisualToggle from "@/app/components/images/TaxonomyVisualToggle";
import CopyButton from "@/app/components/CopyButton";
import { VIEW_AS_SEARCH_TOOLTIP_CLASS } from "@/app/components/viewAsSearchTooltip";
import TableInfo from "@/app/components/TableInfo";
import { decodeRouteParams } from "@/app/helpers/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TableMetadata from "@/types/tableMetadata";

export async function generateMetadata({ params }: { params: Promise<{ taxonomy: string }> }): Promise<Metadata> {
	const { taxonomy } = await decodeRouteParams(params);

	const dbTaxonomy = await trustedPrisma.taxonomy.findUnique({
		where: {
			taxonomy
		}
	});

	if (dbTaxonomy) {
		const mostSpecificRank = RanksBySpecificity.find((rank) => dbTaxonomy[rank]) || "taxonomy";
		const gbifResult = await resolveTaxonomyPageGbif(dbTaxonomy);

		return {
			title: `${dbTaxonomy[mostSpecificRank]} | ${TableMetadata.taxonomy.plural}`,
			description: `Explore the ${gbifResult?.commonName || dbTaxonomy[mostSpecificRank]} taxonomy, including its photos, Red List status, taxonomic classification, and the detected locations.`
		};
	} else {
		return {
			title: "Taxonomy not found"
		};
	}
}

function finestDisplayedRank(db: TaxonomyModel): {
	rankKey: (typeof TaxonomicRanks)[number];
	rankLabel: string;
	displayName: string;
} | null {
	for (const rank of RanksBySpecificity) {
		const raw = db[rank as keyof TaxonomyModel]?.toString().trim();
		if (raw) {
			return {
				rankKey: rank,
				rankLabel: rank.charAt(0).toUpperCase() + rank.slice(1),
				displayName: raw.replace(/_/g, " ")
			};
		}
	}
	return null;
}

function isEnglishVernacularLang(raw: string | undefined): boolean {
	const lang = (raw ?? "").trim().toLowerCase();
	if (!lang) return false;
	if (lang === "en" || lang === "eng") return true;
	return lang.startsWith("en-") || lang.startsWith("en_");
}

/** GBIF + PhyloPic URL for this page — GBIF backbone match is identical to PhyloPicClient (`matchGbifForPhylopic` only). */
async function resolveTaxonomyPageGbif(taxonomyObj: TaxonomyModel): Promise<{
	taxonKey: number;
	mediaTaxonKey: number;
	commonName: string | null;
	phyloPic: { imageUrl: string | null; rank: string; title: string };
} | null> {
	const matched = await matchGbifForPhylopic(taxonomyObj);
	if (!matched) return null;

	const { taxonKey, objectIDs, rankMatched, mediaTaxonKey } = matched;

	const [vnRes, phyloPicRes] = await Promise.all([
		fetch(`https://api.gbif.org/v1/species/${taxonKey}/vernacularNames?limit=80`),
		fetch(`https://api.phylopic.org/resolve/gbif.org/species?embed_primaryImage=true&objectIDs=${objectIDs}`)
	]);

	let commonName: string | null = null;
	try {
		const vnJson = await vnRes.json();
		const results: { vernacularName?: string; language?: string }[] = Array.isArray(vnJson?.results)
			? vnJson.results
			: [];
		const eng = results.find((r) => isEnglishVernacularLang(r.language) && r.vernacularName?.trim());
		const name = eng?.vernacularName;
		if (typeof name === "string" && name.trim()) commonName = name.trim();
	} catch {
		// optional
	}

	const phyloPicJson = await phyloPicRes.json();
	let imageUrl: string | null = null;
	let title = "";
	if (!phyloPicJson.errors && phyloPicJson._embedded?.primaryImage?._links?.vectorFile?.href) {
		imageUrl = phyloPicJson._embedded.primaryImage._links.vectorFile.href;
		title = phyloPicJson._embedded.primaryImage._links.self.title ?? "";
	}

	return {
		taxonKey,
		mediaTaxonKey,
		commonName,
		phyloPic: { imageUrl, rank: rankMatched, title }
	};
}

function StaticActgBackdrop({ className = "" }: { className?: string }) {
	// Non-animated ACTG grid, intended as a subtle texture behind icons.
	const lines = ["ACTGACTGACTG", "CTGACTGACTGA", "TGACTGACTGAC", "GACTGACTGACT", "ACTGACTGACTG"];

	return (
		<div
			className={`font-mono text-[10px] leading-[1.05] tracking-[0.22em] text-primary/60 opacity-70 select-none ${className}`}
		>
			{lines.map((l, i) => (
				<div key={i}>{l}</div>
			))}
		</div>
	);
}

export default async function TaxonomyPage({ params }: { params: Promise<{ taxonomy: string }> }) {
	const { taxonomy } = await decodeRouteParams(params);

	const dbTaxonomy = await trustedPrisma.taxonomy.findUnique({
		where: {
			taxonomy
		},
		include: {
			Samples: true,
			Analyses: {
				distinct: ["project_id"],
				select: {
					project_id: true
				}
			}
		}
	});

	if (!dbTaxonomy) notFound();

	// Get unique project IDs for display
	const uniqueProjects = dbTaxonomy.Analyses.map((a) => a.project_id);
	const pageGbif = await resolveTaxonomyPageGbif(dbTaxonomy as unknown as TaxonomyModel);
	const phyloPic = pageGbif?.phyloPic ?? null;
	const finestRank = finestDisplayedRank(dbTaxonomy as unknown as TaxonomyModel);
	const databaseScientificName = finestRank?.displayName ?? taxonomy.split(";").pop()?.replace(/_/g, " ") ?? taxonomy;
	const databaseRankLabel = finestRank?.rankLabel ?? "Taxonomy";
	const databaseRankKey = finestRank?.rankKey ?? null;
	const classificationRanks = [...RanksBySpecificity].reverse().filter((rank) => {
		const raw = (dbTaxonomy as TaxonomyModel)[rank]?.toString().trim();
		return Boolean(raw);
	});

	return (
		<div id="taxonomy" className="container mx-auto py-6 space-y-6 max-w-full pb-8">
			<header>
				<div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
					<h1 className="mb-0 text-4xl font-semibold leading-[1.05] text-primary">
						{dbTaxonomy.species || dbTaxonomy.genus || taxonomy.split(";").pop()?.replace("_", " ")}
					</h1>
					<TableInfo table="taxonomy" />
					<span className="-translate-y-2 shrink-0 rounded-md bg-base-300 px-2.5 py-1 text-sm font-medium leading-normal text-base-content">
						{databaseRankLabel}
					</span>
				</div>
				<p className="text-lg text-base-content/70">
					Found in {dbTaxonomy.Samples.length === 1 ? "1 sample" : `${dbTaxonomy.Samples.length} samples`} across{" "}
					{uniqueProjects.length === 1 ? "1 project" : `${uniqueProjects.length} projects`}
				</p>
			</header>

			{/* Main grid: image + ranks (left), map + Red List (right), summary cards (bottom) */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-base-200 rounded-lg p-5 shadow-sm h-full">
					<TaxonomyVisualToggle
						taxonomy={dbTaxonomy as unknown as TaxonomyModel}
						mediaTaxonKey={pageGbif?.mediaTaxonKey ?? null}
						databaseRankKey={databaseRankKey}
						phyloPicUrl={phyloPic?.imageUrl ?? null}
						phyloRank={phyloPic?.rank ?? ""}
						phyloTitle={phyloPic?.title ?? ""}
						altScientificName={databaseScientificName}
						databaseRankLabel={databaseRankLabel}
						databaseScientificName={databaseScientificName}
						commonName={pageGbif?.commonName ?? null}
						>
							<div className="flex flex-col items-start gap-3">
								<CopyButton taxonomy={taxonomy} variant="button" label="Copy Taxonomy" />
								{classificationRanks.length ? (
									<div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1.5">
										{classificationRanks.map((rank, idx) => {
											const raw = (dbTaxonomy as TaxonomyModel)[rank]?.toString().trim() ?? "";
											const name = raw.replace(/_/g, " ");
											const rankLabel = rank.charAt(0).toUpperCase() + rank.slice(1);
											const isLast = idx === classificationRanks.length - 1;
											const nameClass =
												rank === "species"
													? "text-sm font-medium italic text-base-content"
													: "text-sm font-medium text-base-content";
											return (
												<div key={rank} className="contents">
													<span className="text-sm font-semibold text-base-content">{rankLabel}</span>
													{isLast ? (
														<span className={nameClass}>{name}</span>
													) : (
														<Link
															href={`/explore/taxonomy?${rank}=${name}`}
															className="link link-hover text-sm font-medium text-primary"
														>
															{name}
														</Link>
													)}
												</div>
											);
										})}
									</div>
								) : (
									<p className="text-sm text-base-content/70">{taxonomy.replace(/_/g, " ")}</p>
								)}
							</div>
						</TaxonomyVisualToggle>
				</div>

				<div className="space-y-4">
					<Map locations={dbTaxonomy.Samples} where={{ taxonomy }} cluster className="h-105 w-full rounded-lg" />
					{pageGbif?.mediaTaxonKey != null ? (
						<div className="bg-base-200 rounded-lg p-6 shadow-sm">
							<GbifIucnStatus taxonKey={pageGbif.mediaTaxonKey} />
						</div>
					) : null}
				</div>

				<div className="lg:col-span-2">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-2/3">
						<Link href={`/search?table=analysis&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}>
							<div
								className={`w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-all duration-300 hover:scale-105 ${VIEW_AS_SEARCH_TOOLTIP_CLASS}`}
								data-tip="View Analyses as Search"
							>
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
									<AnalysisIcon />
								</div>
								<div className="text-center mb-1">
									<div className="text-3xl font-bold text-primary">{dbTaxonomy.Analyses.length}</div>
									<div className="text-sm font-medium text-base-content/70 uppercase">Analyses</div>
								</div>
							</div>
						</Link>

						<Link href={`/search?table=project&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}>
							<div
								className={`w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-all duration-300 hover:scale-105 ${VIEW_AS_SEARCH_TOOLTIP_CLASS}`}
								data-tip="View Projects as Search"
							>
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
									<ProjectIcon />
								</div>
								<div className="text-center mb-1">
									<div className="text-3xl font-bold text-primary">{uniqueProjects.length}</div>
									<div className="text-sm font-medium text-base-content/70 uppercase">Projects</div>
								</div>
							</div>
						</Link>

						<Link href={`/search?table=sample&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}>
							<div
								className={`w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-all duration-300 hover:scale-105 ${VIEW_AS_SEARCH_TOOLTIP_CLASS}`}
								data-tip="View Samples as Search"
							>
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
									<LocationIcon />
								</div>
								<div className="text-center mb-1">
									<div className="text-3xl font-bold text-primary">{dbTaxonomy.Samples.length}</div>
									<div className="text-sm font-medium text-base-content/70 uppercase">Samples</div>
								</div>
							</div>
						</Link>

						<Link
							href={{
								pathname: "/search",
								query: {
									table: "feature",
									advanced: JSON.stringify([["taxonomy", "taxonomy", "contains", taxonomy]])
								}
							}}
						>
							<div
								className={`w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-all duration-300 hover:scale-105 ${VIEW_AS_SEARCH_TOOLTIP_CLASS}`}
								data-tip="Find other Features with this Taxonomy"
							>
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto relative overflow-hidden">
									<StaticActgBackdrop className="opacity-60" />
									<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
										{phyloPic?.imageUrl ? (
											<div className="relative w-12 h-12 opacity-95">
												<ThemeAwarePhyloPic
													src={phyloPic.imageUrl}
													alt="Taxonomic outline"
													className="object-contain"
												/>
											</div>
										) : (
											<div className="text-primary text-3xl font-semibold leading-none">?</div>
										)}
									</div>
								</div>
								<div className="text-center mb-1 px-2">
									<div className="text-sm font-medium text-base-content/70 uppercase">Features</div>
									<div className="text-sm font-semibold text-primary leading-snug">
										Find other Features with this Taxonomy
									</div>
								</div>
							</div>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
