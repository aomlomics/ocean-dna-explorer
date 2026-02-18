import { prisma } from "@/app/helpers/prisma";
import Map from "@/app/components/map/Map";
import Link from "next/link";
import { TaxonomicRanks } from "@/types/objects";
import PhyloPic from "@/app/components/images/PhyloPic";
import CopyButton from "@/app/components/CopyButton";
import TableMetadata from "@/types/tableMetadata";
import { Taxonomy } from "@/app/generated/prisma/client";
import { AnalysisIcon, ProjectIcon, LocationIcon } from "@/app/components/icons";

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
						Taxonomies: {
							some: {
								taxonomy
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
				<div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
					{/* Left & Center: Taxonomic Image (spans 2 columns) */}
					<div className="md:col-span-2 bg-base-200 rounded-lg p-6 flex flex-col items-center">
						<div className="w-full max-w-xs aspect-square flex items-center justify-center mb-28 relative">
							<PhyloPic taxonomy={dbTaxonomy} />
						</div>
						<h4 className="text-sm font-semibold text-base-content/80 mb-2">Taxonomic Image Attribution</h4>
						<p className="text-xs text-base-content/60 leading-relaxed text-center">
							The taxonomic outline image is sourced through{" "}
							<Link href="https://www.phylopic.org/" className="text-primary hover:underline" target="_blank">
								PhyloPic
							</Link>
							, using{" "}
							<Link href="https://www.gbif.org/" className="text-primary hover:underline" target="_blank">
								GBIF
							</Link>{" "}
							Suggest API to match our taxonomy with PhyloPic's database.
						</p>
					</div>

					{/* Right: Taxonomic Rankings */}
					<div className="bg-base-200 rounded-lg p-6 flex flex-col">
						<h3 className="text-md font-semibold text-base-content/80">Taxonomic Hierarchy</h3>
						<div className="mb-2">
							<CopyButton taxonomy={taxonomy} />
						</div>
						<p className="text-xs text-base-content/60 text-left mb-4">Click each rank to explore related taxa!</p>
						<div className="space-y-4 flex-1">
							{formatTaxonomyDisplay(dbTaxonomy).map((item) => {
								const isSpecies = item.rankKey === "species";
								const rankSearchUrl = `/explore/taxonomy?${item.rankKey}=${encodeURIComponent(
									item.name.replace(" ", "_")
								)}`;

								if (isSpecies) {
									return (
										<div key={item.rank} className="text-left rounded px-3 py-2 mb-3">
											<div className="text-[10px] font-medium text-base-content/50 uppercase tracking-widest">
												{item.rank}
											</div>
											<div className="text-sm font-semibold text-base-content/80">{item.name}</div>
										</div>
									);
								}

								return (
									<Link key={item.rank} href={rankSearchUrl}>
										<div className="text-left cursor-pointer bg-base-300/30 hover:bg-base-300/60 transition-colors rounded px-3 py-2 mb-3">
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
		</div>
	);
}
