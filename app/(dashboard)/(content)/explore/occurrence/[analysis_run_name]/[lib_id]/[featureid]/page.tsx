import Map from "@/app/components/map/Map";
import PhyloPic from "@/app/components/images/PhyloPic";
import TableMetadata from "@/types/tableMetadata";
import { Occurrence, Taxonomy } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import StatCard from "@/app/components/explore/StatCard";
import { AnalysisIcon, DnaIcon, LocationIcon } from "@/app/components/icons";

function formatTaxonomyDisplay(dbTaxonomy: Taxonomy) {
	const taxonomicData = Object.entries(dbTaxonomy)
		.filter(([key, value]) => {
			return (
				[
					"domain",
					"kingdom",
					"supergroup",
					"division",
					"subdivision",
					"phylum",
					"class",
					"order",
					"family",
					"genus",
					"species"
				].includes(key) && value
			);
		})
		.map(([key, value]) => ({
			rank: key.charAt(0).toUpperCase() + key.slice(1),
			name: String(value).replace("_", " ")
		}));

	return (
		<div className="space-y-1.5">
			{taxonomicData.map((item) => (
				<div key={item.rank} className="py-1">
					<span className="text-base-content/70 font-semibold text-sm">{item.rank}: </span>
					<span className="text-base-content font-medium text-sm">{item.name}</span>
				</div>
			))}
		</div>
	);
}

export default async function Analysis_run_name_Lib_id_Featureid({
	params
}: {
	params: Promise<{
		analysis_run_name: Occurrence["analysis_run_name"];
		lib_id: Occurrence["lib_id"];
		featureid: Occurrence["featureid"];
	}>;
}) {
	let { analysis_run_name, lib_id, featureid } = await params;
	analysis_run_name = decodeURIComponent(analysis_run_name);
	lib_id = decodeURIComponent(lib_id);
	featureid = decodeURIComponent(featureid);

	const { occurrence, assignment } = await prisma.$transaction(async (tx) => {
		const occurrence = await tx.occurrence.findUnique({
			where: {
				analysis_run_name_lib_id_featureid: {
					analysis_run_name,
					lib_id,
					featureid
				}
			},
			include: {
				Library: {
					select: {
						Sample: {
							include: {
								Project: {
									select: {
										isPrivate: true
									}
								}
							}
						}
					}
				},
				Analysis: {
					select: {
						assay_name: true,
						project_id: true,
						isPrivate: true
					}
				},
				Feature: {
					select: {
						dna_sequence: true
					}
				}
			}
		});

		if (!occurrence) {
			return { occurrence: null, assignment: null };
		}

		const assignment = await tx.assignment.findUnique({
			where: {
				analysis_run_name_featureid: {
					analysis_run_name,
					featureid
				}
			},
			include: {
				Taxonomy: true
			}
		});

		return { occurrence, assignment };
	});

	if (!occurrence) return <>Occurrence not found</>;

	const isPrivate = occurrence.Analysis.isPrivate || occurrence.Library.Sample.Project.isPrivate;

	const occurrenceTitle = `${featureid} in ${lib_id} (${analysis_run_name})`;

	const taxonomyObject = assignment?.Taxonomy ?? null;
	const taxonomyName =
		taxonomyObject?.species ||
		taxonomyObject?.genus ||
		taxonomyObject?.taxonomy ||
		assignment?.taxonomy ||
		"Unknown taxonomy";

	return (
		<div className="space-y-8 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/analysis" className="text-primary hover:text-primary-focus">
							Analyses
						</Link>
					</li>
					<li>
						<Link href={`/explore/analysis/${analysis_run_name}`} className="text-primary hover:text-primary-focus">
							{analysis_run_name}
						</Link>
					</li>
					<li>
						<Link href="/explore/occurrence" className="text-primary hover:text-primary-focus">
							Occurrences
						</Link>
					</li>
					<li>{occurrenceTitle}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<h1
						className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right"
						data-tip={TableMetadata.occurrence.description}
					>
						{occurrenceTitle}
					</h1>
					{isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				<p className="text-lg text-base-content/70 max-w-3xl">
					This occurrence links the feature{" "}
					<Link href={`/explore/feature/${featureid}`} className="link link-primary link-hover">
						{featureid}
					</Link>{" "}
					to the library{" "}
					<Link href={`/explore/library/${lib_id}`} className="link link-primary link-hover">
						{lib_id}
					</Link>{" "}
					in the analysis{" "}
					<Link href={`/explore/analysis/${analysis_run_name}`} className="link link-primary link-hover">
						{analysis_run_name}
					</Link>{" "}
					with the assay{" "}
					<Link href={`/explore/assay/${occurrence.Analysis.assay_name}`} className="link link-primary link-hover">
						{occurrence.Analysis.assay_name}
					</Link>
					.
				</p>
			</header>

			<section className="mt-2 space-y-8">
				{/* Top layout: map and occurrence details */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
					{/* Left: Single-sample map */}
					<div className="h-full">
						<Map locations={[occurrence.Library.Sample]} className="aspect-square rounded-xl overflow-hidden" />
					</div>

					{/* Right: Featured data */}
					<div className="lg:col-span-2 h-full">
						<div className="bg-base-200 rounded-xl p-6 h-full flex flex-col">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
								{/* Left: taxonomic image, name, and organism quantity */}
								<div className="flex flex-col items-center justify-center gap-6 h-full text-center">
									{taxonomyObject && (
										<div className="w-32 h-32 md:w-40 md:h-40 relative">
											<PhyloPic taxonomy={taxonomyObject} />
										</div>
									)}
									<div className="space-y-3">
										{taxonomyObject ? (
											<Link
												href={`/explore/taxonomy/${encodeURIComponent(taxonomyObject.taxonomy)}`}
												className="text-base md:text-lg font-semibold text-base-content hover:text-primary wrap-break-word"
											>
												{taxonomyName}
											</Link>
										) : (
											<p className="text-base md:text-lg font-semibold text-base-content">{taxonomyName}</p>
										)}
										<div className="space-y-1">
											<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
												Organism quantity
											</p>
											<p className="text-4xl md:text-5xl font-bold text-primary leading-tight">
												{occurrence.organismQuantity.toLocaleString()}
											</p>
										</div>
									</div>
								</div>

								{/* Right: full taxonomy and DNA sequence */}
								<div className="space-y-5">
									<div className="space-y-2">
										<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Full taxonomy</p>
										<div className="max-h-40 overflow-y-auto pr-1 bg-base-200/60 rounded-lg p-3">
											{taxonomyObject ? (
												formatTaxonomyDisplay(taxonomyObject)
											) : (
												<p className="text-sm text-base-content/70">No taxonomy assignment available.</p>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">DNA sequence</p>
										<p className="font-mono text-sm md:text-base text-base-content break-all bg-base-200/60 rounded-lg p-3">
											{occurrence.Feature.dna_sequence}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Context: library, feature, analysis, assay */}
				<div className="pt-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<StatCard
							title="Library"
							icon={<LocationIcon />}
							value={lib_id}
							link={`/explore/library/${lib_id}`}
							layout="horizontal"
						/>
						<StatCard
							title="Feature"
							icon={<DnaIcon />}
							value={featureid}
							link={`/explore/feature/${featureid}`}
							layout="horizontal"
						/>
						<StatCard
							title="Analysis"
							icon={<AnalysisIcon />}
							value={analysis_run_name}
							link={`/explore/analysis/${analysis_run_name}`}
							layout="horizontal"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
