import { prisma } from "@/app/helpers/prisma";
import Map from "@/app/components/map/Map";
import Link from "next/link";
import { RanksBySpecificity, TaxonomicRanks } from "@/types/objects";
import CopyButton from "@/app/components/CopyButton";
import TableMetadata from "@/types/tableMetadata";
import { Taxonomy } from "@/app/generated/prisma/client";
import { AnalysisIcon, ProjectIcon, LocationIcon } from "@/app/components/icons";
import ThemeAwarePhyloPic from "@/app/components/images/ThemeAwarePhyloPic";

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

async function resolvePhyloPicVector(taxonomyObj: Taxonomy): Promise<{ imageUrl: string; rank: string; title: string } | null> {
	let gbifTaxonomy: any;
	let imageDetails = { rank: "", title: "" };

	for (const rank of RanksBySpecificity) {
		if (taxonomyObj[rank] && /^[a-zA-Z]+$/.test(taxonomyObj[rank].toString())) {
			// retrieve suggested taxonomies from GBIF
			const gbifTaxaRes = await fetch(`https://api.gbif.org/v1/species/suggest?q=${taxonomyObj[rank]}`);
			const gbifTaxa = await gbifTaxaRes.json();

			// get only the taxonomies that match the specific rank
			const gbifTaxonomyArr = gbifTaxa.filter(
				(taxa: Record<string, any>) => taxa.rank.toLowerCase() === rank && taxa.status === "ACCEPTED"
			);

			if (gbifTaxonomyArr.length === 1) {
				gbifTaxonomy = gbifTaxonomyArr[0];
				imageDetails.rank = rank;
				break;
			}
		}
	}

	if (!gbifTaxonomy) return null;

	// use result of GBIF API to query PhyloPics for the vector image
	const objectIDs =
		`${gbifTaxonomy.speciesKey ? gbifTaxonomy.speciesKey + "," : ""}` +
		`${gbifTaxonomy.genusKey ? gbifTaxonomy.genusKey + "," : ""}` +
		`${gbifTaxonomy.familyKey ? gbifTaxonomy.familyKey + "," : ""}` +
		`${gbifTaxonomy.orderKey ? gbifTaxonomy.orderKey + "," : ""}` +
		`${gbifTaxonomy.classKey ? gbifTaxonomy.classKey + "," : ""}` +
		`${gbifTaxonomy.phylumKey ? gbifTaxonomy.phylumKey + "," : ""}` +
		`${gbifTaxonomy.kingdomKey ? gbifTaxonomy.kingdomKey : ""}`;

	const phyloPicRes = await fetch(
		`https://api.phylopic.org/resolve/gbif.org/species?embed_primaryImage=true&objectIDs=${objectIDs}`
	);
	const phyloPic = await phyloPicRes.json();
	if (phyloPic.errors) return null;

	const imageUrl = phyloPic._embedded.primaryImage._links.vectorFile.href;
	imageDetails.title = phyloPic._embedded.primaryImage._links.self.title;

	return { imageUrl, rank: imageDetails.rank, title: imageDetails.title };
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
	const speciesDisplay = dbTaxonomy.species ? String(dbTaxonomy.species).replace("_", " ") : "";
	const phyloPic = await resolvePhyloPicVector(dbTaxonomy as unknown as Taxonomy);

	return (
		<div className="container mx-auto py-6 space-y-6 max-w-full pb-8">
			<header>
				<div className="flex gap-2 items-center">
					<h1
						className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right before:bg-base-100 before:text-base-content before:border before:border-base-300"
						data-tip={TableMetadata.taxonomy.description}
					>
						{dbTaxonomy.species || dbTaxonomy.genus || taxonomy.split(";").pop()?.replace("_", " ")}
					</h1>
				</div>
				<p className="text-lg text-base-content/70">
					Found in {samples.length === 1 ? "1 sample" : `${samples!.length} samples`} across{" "}
					{uniqueProjects.length === 1 ? "1 project" : `${uniqueProjects.length} projects`}
				</p>
			</header>

			{/* Main Grid Layout: Map + Taxonomic Section Side by Side */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Left: Map */}
				<div className="lg:col-span-2 space-y-4">
					<Map locations={samples} where={{ taxonomy }} cluster className="h-105 w-full rounded-lg" />

					{/* Cards Below Map */}
					<div className="grid grid-cols-3 gap-3">
						{/* Analyses Card */}
						<Link href={`/search?table=analysis&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}>
							<div className="w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-colors">
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
									<AnalysisIcon />
								</div>
								<div className="text-center mb-1">
									<div className="text-3xl font-bold text-primary">{dbTaxonomy.Assignments.length}</div>
									<div className="text-sm font-medium text-base-content/70 uppercase">Analyses</div>
								</div>
							</div>
						</Link>

						{/* Projects Card */}
						<Link href={`/search?table=project&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}>
							<div className="w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-colors">
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
							<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
								<LocationIcon />
							</div>
							<div className="text-center mb-1">
								<div className="text-3xl font-bold text-primary">{samples.length}</div>
								<div className="text-sm font-medium text-base-content/70 uppercase">Samples</div>
							</div>
						</Link>
					</div>
				</div>

				{/* Right: Taxonomic Image + Rankings Grid (3 columns in remaining space) */}
				<div className="lg:col-span-2 grid grid-cols-1 gap-4 items-stretch">
					{/* Combined: Taxonomic Image + Taxonomic Hierarchy */}
					<div className="bg-base-200 rounded-lg p-6 shadow-sm relative h-105 flex flex-col">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch flex-1 min-h-0">
							{/* Taxonomic Image (spans 2 columns) */}
							<div className="md:col-span-2 flex flex-col items-center">
								<div className="w-full max-w-xs aspect-square flex items-center justify-center relative">
									{phyloPic ? (
										<div
											className="tooltip tooltip-bottom tooltip-primary w-full h-full before:bg-base-100 before:text-base-content before:border before:border-base-300"
											data-tip={`Image of ${phyloPic.rank[0].toUpperCase() + phyloPic.rank.slice(1)}: ${phyloPic.title}`}
										>
											<ThemeAwarePhyloPic
												src={phyloPic.imageUrl}
												alt="Image of taxonomy"
												priority={true}
												fill
												className="object-contain"
											/>
										</div>
									) : (
										<div className="w-full h-full flex items-center justify-center text-base-content/50">
											No Image
										</div>
									)}
								</div>

								{/* Species sits directly under the outline */}
								{speciesDisplay && (
									<div className="mt-2 text-center">
										<div className="flex items-center justify-center gap-2">
											<div className="text-[10px] font-medium text-base-content/50 uppercase tracking-widest">Species</div>
											<div className="dropdown dropdown-end">
												<div
													tabIndex={0}
													role="button"
													aria-label="Taxonomic image attribution"
													className="btn btn-xs btn-circle btn-ghost tooltip tooltip-top before:bg-base-200 before:text-base-content before:border before:border-base-300"
													data-tip="Taxonomic image attribution"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 24 24"
														fill="none"
														className="stroke-current text-primary shrink-0 w-5 h-5"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth="2"
															d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
														></path>
													</svg>
												</div>
												<div tabIndex={0} className="dropdown-content z-50 w-80 bg-base-200 rounded-box shadow-sm p-3">
													<h4 className="text-sm font-semibold text-base-content/80 mb-1">Taxonomic Image Attribution</h4>
													<p className="text-xs text-base-content/60 leading-relaxed">
														The taxonomic outline image is sourced through{" "}
														<Link
															href="https://www.phylopic.org/"
															className="text-primary hover:underline"
															target="_blank"
														>
															PhyloPic
														</Link>
														, using{" "}
														<Link
															href="https://www.gbif.org/"
															className="text-primary hover:underline"
															target="_blank"
														>
															GBIF
														</Link>{" "}
														Suggest API to match our taxonomy with PhyloPic&apos;s database.
													</p>
												</div>
											</div>
										</div>
										<div className="text-base sm:text-lg font-semibold text-primary">{speciesDisplay}</div>
									</div>
								)}
							</div>

							{/* Taxonomic Hierarchy */}
							<div className="flex flex-col min-h-0">
								<h3 className="text-md font-semibold text-base-content/80">Taxonomic Hierarchy</h3>
								<div className="mb-2">
									<CopyButton taxonomy={taxonomy} />
								</div>
								<p className="text-xs text-base-content/60 text-left mb-4">Click each rank to explore related taxa!</p>
								<div className="space-y-1 flex-1 min-h-0 overflow-y-auto pr-1">
									{formatTaxonomyDisplay(dbTaxonomy)
										.filter((item) => item.rankKey !== "species")
										.map((item) => {
										const rankSearchUrl = `/explore/taxonomy?${item.rankKey}=${encodeURIComponent(
											item.name.replace(" ", "_")
										)}`;

										return (
											<Link key={item.rank} href={rankSearchUrl}>
												<div className="text-left cursor-pointer hover:bg-base-300/30 transition-colors rounded-md px-2 py-1">
													<div className="text-[10px] font-medium text-base-content/50 uppercase tracking-widest">
														{item.rank}
													</div>
													<div className="text-sm font-semibold text-primary hover:text-primary-focus transition-colors">
														{item.name}
													</div>
												</div>
											</Link>
										);
									})}
								</div>
							</div>
						</div>
					</div>

					{/* Features Card */}
					<div className="flex">
						<Link
							href={{
								pathname: "/search",
								query: {
									table: "feature",
									advanced: JSON.stringify([["taxonomy", "taxonomy", "contains", taxonomy]])
								}
							}}
							className="w-full sm:w-auto sm:max-w-md bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-colors"
						>
							<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto relative overflow-hidden">
								<StaticActgBackdrop className="opacity-60" />
								<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
									{phyloPic ? (
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
								<div className="text-xs text-base-content/60">This will take you to the Search page</div>
							</div>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
