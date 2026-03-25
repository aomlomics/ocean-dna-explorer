import { prisma } from "@/app/helpers/prisma";
import Map from "@/app/components/map/Map";
import Link from "next/link";
import { RanksBySpecificity, TaxonomicRanks } from "@/types/objects";
import CopyButton from "@/app/components/CopyButton";
import TableMetadata from "@/types/tableMetadata";
import { Taxonomy } from "@/app/generated/prisma/client";
import { AnalysisIcon, ProjectIcon, LocationIcon } from "@/app/components/icons";
import ThemeAwarePhyloPic from "@/app/components/images/ThemeAwarePhyloPic";
import GbifIucnStatus from "@/app/components/images/GbifIucnStatus";
import TaxonomyVisualToggle from "@/app/components/images/TaxonomyVisualToggle";

function formatTaxonomyDisplay(dbTaxonomy: any) {
	const taxonomicData = Object.entries(dbTaxonomy)
		.filter(([key, value]) => {
			return TaxonomicRanks.includes(key as (typeof TaxonomicRanks)[0]) && value;
		})
		.map(([key, value]) => ({
			rank: key.charAt(0).toUpperCase() + key.slice(1),
			name: String(value).replace("_", " "),
			rankKey: key
		}));

	return taxonomicData;
}

function finestDisplayedRank(db: Taxonomy): { rankLabel: string; displayName: string } | null {
	for (const rank of RanksBySpecificity) {
		const raw = db[rank as keyof Taxonomy]?.toString().trim();
		if (raw) {
			return {
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

/** GBIF suggest + common name + PhyloPic URL for this page only (PhyloPic components stay unchanged). */
async function resolveTaxonomyPageGbif(taxonomyObj: Taxonomy): Promise<{
	taxonKey: number;
	/** Backbone / nub key — GBIF `/species/{id}/media` is often populated here, not on every checklist key. */
	mediaTaxonKey: number;
	commonName: string | null;
	phyloPic: { imageUrl: string | null; rank: string; title: string };
	/** Same GBIF key chain passed to PhyloPic `objectIDs` — use client-side so silhouettes align with server common name / GBIF photo. */
	phylopicObjectIds: string;
} | null> {
	let gbifTaxonomy: any;
	let rankMatched = "";

	for (const rank of RanksBySpecificity) {
		const rawRank = taxonomyObj[rank]?.toString().trim();
		if (!rawRank || !/^[a-zA-Z0-9][a-zA-Z0-9_\s.-]*$/.test(rawRank)) continue;

		const suggestQuery = rawRank.replace(/_/g, " ");
		const gbifTaxaRes = await fetch(
			`https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(suggestQuery)}`
		);
		const gbifTaxa = await gbifTaxaRes.json();
		const gbifTaxonomyArr = gbifTaxa.filter(
			(taxa: Record<string, any>) => taxa.rank.toLowerCase() === rank && taxa.status === "ACCEPTED"
		);
		if (gbifTaxonomyArr.length === 1) {
			gbifTaxonomy = gbifTaxonomyArr[0];
			rankMatched = rank;
			break;
		}
	}

	if (!gbifTaxonomy) return null;

	const taxonKey = gbifTaxonomy.key ?? gbifTaxonomy.nubKey;
	if (taxonKey == null) return null;

	const objectIDs =
		`${gbifTaxonomy.speciesKey ? gbifTaxonomy.speciesKey + "," : ""}` +
		`${gbifTaxonomy.genusKey ? gbifTaxonomy.genusKey + "," : ""}` +
		`${gbifTaxonomy.familyKey ? gbifTaxonomy.familyKey + "," : ""}` +
		`${gbifTaxonomy.orderKey ? gbifTaxonomy.orderKey + "," : ""}` +
		`${gbifTaxonomy.classKey ? gbifTaxonomy.classKey + "," : ""}` +
		`${gbifTaxonomy.phylumKey ? gbifTaxonomy.phylumKey + "," : ""}` +
		`${gbifTaxonomy.kingdomKey ? gbifTaxonomy.kingdomKey : ""}`;

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

	const mediaTaxonKey = Number(gbifTaxonomy.nubKey ?? taxonKey);

	return {
		taxonKey: Number(taxonKey),
		mediaTaxonKey,
		commonName,
		phyloPic: { imageUrl, rank: rankMatched, title },
		phylopicObjectIds: objectIDs
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

export default async function TaxonomyPage({ params }: { params: Promise<{ taxonomy: Taxonomy["taxonomy"] }> }) {
	let { taxonomy } = await params;
	taxonomy = decodeURIComponent(taxonomy);

	const [dbTaxonomy, samples] = await prisma.$transaction([
		prisma.taxonomy.findUnique({
			where: {
				taxonomy
			},
			include: {
				Assignments: {
					distinct: ["analysis_run_name"],
					select: {
						analysis_run_name: true,
						Analysis: {
							select: {
								project_id: true
							}
						}
					}
				}
			}
		}),
		prisma.sample.findMany({
			where: {
				Libraries: {
					some: {
						Occurrences: {
							some: {
								Assignment: {
									taxonomy
								}
							}
						}
					}
				}
			}
		})
	]);

	if (!dbTaxonomy) return <>Taxonomy not found</>;

	// Get unique project IDs for display
	const uniqueProjects = [...new Set(dbTaxonomy.Assignments.map((a) => a.Analysis.project_id))];
	const pageGbif = await resolveTaxonomyPageGbif(dbTaxonomy as unknown as Taxonomy);
	const phyloPic = pageGbif?.phyloPic ?? null;
	const finestRank = finestDisplayedRank(dbTaxonomy as unknown as Taxonomy);
	const databaseScientificName =
		finestRank?.displayName ?? taxonomy.split(";").pop()?.replace(/_/g, " ") ?? taxonomy;
	const databaseRankLabel = finestRank?.rankLabel ?? "Taxonomy";
	const breadcrumbRanks = [...RanksBySpecificity].reverse().filter((rank) => {
		const raw = (dbTaxonomy as any)[rank]?.toString().trim();
		return Boolean(raw);
	});

	return (
		<div className="container mx-auto py-6 space-y-6 max-w-full pb-8">
			<header>
				<div className="flex gap-4 items-baseline flex-wrap">
					<h1
						className="text-4xl font-semibold text-primary tooltip tooltip-right before:bg-base-100 before:text-base-content before:border before:border-base-300"
						data-tip={TableMetadata.taxonomy.description}
					>
						{dbTaxonomy.species || dbTaxonomy.genus || taxonomy.split(";").pop()?.replace("_", " ")}
					</h1>
					<span className="badge bg-base-200 text-base-content ml-2">
						{databaseRankLabel}
					</span>
				</div>
				{breadcrumbRanks.length ? (
					<div className="flex flex-wrap items-baseline gap-4">
						<div className="breadcrumbs text-sm text-base-content/70">
							<ul>
								{breadcrumbRanks.map((rank, idx) => {
									const raw = (dbTaxonomy as any)[rank]?.toString().trim() ?? "";
									const name = raw.replace(/_/g, " ");
									const isLast = idx === breadcrumbRanks.length - 1;
									const rankSearchUrl = `/explore/taxonomy?${rank}=${encodeURIComponent(name.replace(" ", "_"))}`;
									return (
										<li key={rank}>
											{isLast ? (
												<span className="font-medium text-base-content/70">
													{name}
												</span>
											) : (
												<Link href={rankSearchUrl} className="link link-hover text-primary">
													{name}
												</Link>
											)}
										</li>
									);
								})}
							</ul>
						</div>
						<div className="flex items-center gap-2 ml-4">
							<CopyButton taxonomy={taxonomy} />
						</div>
					</div>
				) : (
					<div className="mt-1">
						<CopyButton taxonomy={taxonomy} />
					</div>
				)}
				<p className="text-lg text-base-content/70">
					Found in {samples.length === 1 ? "1 sample" : `${samples!.length} samples`} across{" "}
					{uniqueProjects.length === 1 ? "1 project" : `${uniqueProjects.length} projects`}
				</p>
			</header>

			{/* Main grid: taxonomy card (left) + map & stats (right) */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Left: taxonomy, image, hierarchy, Red List */}
				<div className="lg:col-span-2 grid grid-cols-1 gap-4 items-stretch">
					<div className="bg-base-200 rounded-lg p-6 shadow-sm flex flex-col gap-4">
						<div className="grid grid-cols-1 gap-6 items-start min-h-0">
							<div className="flex flex-col items-center">
								<TaxonomyVisualToggle
									taxonomy={dbTaxonomy as unknown as Taxonomy}
									mediaTaxonKey={pageGbif?.mediaTaxonKey ?? null}
									phyloPicUrl={phyloPic?.imageUrl ?? null}
									phylopicObjectIds={pageGbif?.phylopicObjectIds ?? null}
									phyloRank={phyloPic?.rank ?? ""}
									phyloTitle={phyloPic?.title ?? ""}
									altScientificName={databaseScientificName}
									databaseRankLabel={databaseRankLabel}
									databaseScientificName={databaseScientificName}
									commonName={pageGbif?.commonName ?? null}
								/>
							</div>
						</div>
					</div>

					{pageGbif?.mediaTaxonKey != null ? (
						<div className="bg-base-200 rounded-lg p-6 shadow-sm">
							<GbifIucnStatus taxonKey={pageGbif.mediaTaxonKey} />
						</div>
					) : null}

				</div>

				{/* Right: map + summary cards */}
				<div className="lg:col-span-2 space-y-4">
					<Map locations={samples} where={{ taxonomy }} cluster className="h-105 w-full rounded-lg" />

					<div className="grid grid-cols-3 gap-4 auto-rows-fr">
						<Link href={`/search?table=analysis&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}>
							<div className="w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-colors tooltip tooltip-top before:bg-base-100 before:text-base-content before:border before:border-base-300" data-tip="View as Search">
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
									<AnalysisIcon />
								</div>
								<div className="text-center mb-1">
									<div className="text-3xl font-bold text-primary">{dbTaxonomy.Assignments.length}</div>
									<div className="text-sm font-medium text-base-content/70 uppercase">Analyses</div>
								</div>
							</div>
						</Link>

						<Link href={`/search?table=project&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}>
							<div className="w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-colors tooltip tooltip-top before:bg-base-100 before:text-base-content before:border before:border-base-300" data-tip="View as Search">
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
									<ProjectIcon />
								</div>
								<div className="text-center mb-1">
									<div className="text-3xl font-bold text-primary">{uniqueProjects.length}</div>
									<div className="text-sm font-medium text-base-content/70 uppercase">Projects</div>
								</div>
							</div>
						</Link>

						<Link
							href={`/search?table=sample&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}
							className="w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-colors"
						>
							<div className="w-full h-full tooltip tooltip-top before:bg-base-100 before:text-base-content before:border before:border-base-300" data-tip="View as Search">
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
									<LocationIcon />
								</div>
								<div className="text-center mb-1">
									<div className="text-3xl font-bold text-primary">{samples.length}</div>
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
							<div className="w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-colors tooltip tooltip-top before:bg-base-100 before:text-base-content before:border before:border-base-300" data-tip="View as Search">
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto relative overflow-hidden">
									<StaticActgBackdrop className="opacity-60" />
									<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
										{phyloPic?.imageUrl ? (
											<div className="relative w-12 h-12 opacity-95">
												<ThemeAwarePhyloPic src={phyloPic.imageUrl} alt="Taxonomic outline" fill className="object-contain" />
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
