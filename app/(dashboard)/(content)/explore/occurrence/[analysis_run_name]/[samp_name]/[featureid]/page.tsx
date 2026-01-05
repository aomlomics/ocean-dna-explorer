import Map from "@/app/components/map/Map";
import PhyloPic from "@/app/components/images/PhyloPic";
import TableMetadata from "@/types/tableMetadata";
import { Occurrence, Taxonomy } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";

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

export default async function Analysis_run_name_Samp_name_Featureid({
	params
}: {
	params: Promise<{
		analysis_run_name: Occurrence["analysis_run_name"];
		samp_name: Occurrence["samp_name"];
		featureid: Occurrence["featureid"];
	}>;
}) {
	let { analysis_run_name, samp_name, featureid } = await params;
	analysis_run_name = decodeURIComponent(analysis_run_name);
	samp_name = decodeURIComponent(samp_name);
	featureid = decodeURIComponent(featureid);

	const { occurrence, assignment } = await prisma.$transaction(async (tx) => {
		const occurrence = await tx.occurrence.findUnique({
			where: {
				analysis_run_name_samp_name_featureid: {
					analysis_run_name,
					samp_name,
					featureid
				}
			},
			include: {
				Sample: {
					select: {
						samp_name: true,
						project_id: true,
						decimalLatitude: true,
						decimalLongitude: true,
						geo_loc_name: true,
						eventDate: true,
						Project: {
							select: {
								isPrivate: true
							}
						}
					}
				},
				Analysis: {
					select: {
						analysis_run_name: true,
						assay_name: true,
						project_id: true,
						isPrivate: true
					}
				},
				Feature: {
					select: {
						featureid: true,
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

	const isPrivate = occurrence.Analysis.isPrivate || occurrence.Sample.Project.isPrivate;

	const occurrenceTitle = `${occurrence.Feature.featureid} in ${occurrence.Sample.samp_name} (${occurrence.Analysis.analysis_run_name})`;

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
						<Link
							href={`/explore/analysis/${occurrence.Analysis.analysis_run_name}`}
							className="text-primary hover:text-primary-focus"
						>
							{occurrence.Analysis.analysis_run_name}
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
					This occurrence links{" "}
					<Link href={`/explore/feature/${occurrence.Feature.featureid}`} className="link link-primary link-hover">
						feature {occurrence.Feature.featureid}
					</Link>{" "}
					to{" "}
					<Link href={`/explore/sample/${occurrence.Sample.samp_name}`} className="link link-primary link-hover">
						sample {occurrence.Sample.samp_name}
					</Link>{" "}
					in{" "}
					<Link
						href={`/explore/analysis/${occurrence.Analysis.analysis_run_name}`}
						className="link link-primary link-hover"
					>
						analysis {occurrence.Analysis.analysis_run_name}
					</Link>
					.
				</p>
			</header>

			<section className="mt-2 space-y-8">
				{/* Top layout: map and occurrence details */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
					{/* Left: Single-sample map */}
					<div className="h-full">
						<Map locations={[occurrence.Sample]} className="aspect-square rounded-xl overflow-hidden" />
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

				{/* Context: sample, feature, analysis, assay */}
				<div className="pt-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-base-200 rounded-xl px-4 py-3 flex items-center gap-3">
							<div
								className="w-10 h-10 text-primary"
								style={{
									backgroundColor: "currentColor",
									WebkitMaskImage: "url(/images/icons/location_pin.svg)",
									maskImage: "url(/images/icons/location_pin.svg)",
									WebkitMaskRepeat: "no-repeat",
									maskRepeat: "no-repeat",
									WebkitMaskPosition: "center",
									maskPosition: "center",
									WebkitMaskSize: "contain"
								}}
							/>
							<div className="space-y-1">
								<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Sample</p>
								<Link
									href={`/explore/sample/${occurrence.Sample.samp_name}`}
									className="text-base-content font-medium hover:text-primary break-all"
								>
									{occurrence.Sample.samp_name}
								</Link>
							</div>
						</div>

						<div className="bg-base-200 rounded-xl px-4 py-3 flex items-center gap-3">
							<div
								className="w-12 h-10 text-primary"
								style={{
									backgroundColor: "currentColor",
									WebkitMaskImage: "url(/images/icons/dna_icon.svg)",
									maskImage: "url(/images/icons/dna_icon.svg)",
									WebkitMaskRepeat: "no-repeat",
									maskRepeat: "no-repeat",
									WebkitMaskPosition: "center",
									maskPosition: "center",
									WebkitMaskSize: "contain"
								}}
							/>
							<div className="space-y-1">
								<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Feature</p>
								<Link
									href={`/explore/feature/${occurrence.Feature.featureid}`}
									className="text-base-content font-medium hover:text-primary break-all"
								>
									{occurrence.Feature.featureid}
								</Link>
							</div>
						</div>

						<div className="bg-base-200 rounded-xl px-4 py-3 flex items-center gap-3">
							<div
								className="w-10 h-10 text-primary"
								style={{
									backgroundColor: "currentColor",
									WebkitMaskImage: "url(/images/analysis_outline_image.svg)",
									maskImage: "url(/images/analysis_outline_image.svg)",
									WebkitMaskRepeat: "no-repeat",
									maskRepeat: "no-repeat",
									WebkitMaskPosition: "center",
									maskPosition: "center",
									WebkitMaskSize: "contain"
								}}
							/>
							<div>
								<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Analysis</p>
								<Link
									href={`/explore/analysis/${occurrence.Analysis.analysis_run_name}`}
									className="text-base-content font-medium hover:text-primary break-all"
								>
									{occurrence.Analysis.analysis_run_name}
								</Link>
								<p className="text-xs text-base-content/70 mt-1">
									Assay:{" "}
									<Link
										href={`/explore/assay/${occurrence.Analysis.assay_name}`}
										className="link link-primary link-hover"
									>
										{occurrence.Analysis.assay_name}
									</Link>
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
