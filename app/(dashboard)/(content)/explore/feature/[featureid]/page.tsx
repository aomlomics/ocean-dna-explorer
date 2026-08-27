import TableMetadata, { exploreUrl } from "@/types/tableMetadata";
import type { Taxonomy } from "@/app/generated/prisma/client";
import { trustedPrisma } from "@/app/helpers/prisma";
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PhyloPic from "@/app/components/images/PhyloPic";
import GcDonut from "@/app/components/charts/GcDonut";
import Table from "@/app/components/paginated/table/Table";
import AssaysCard from "@/app/components/assay/AssaysCard";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import Map from "@/app/components/map/Map";
import CopyButton from "@/app/components/CopyButton";
import { DashCardInfoButton } from "@/app/components/dataSummary/DashCard";
import { decodeRouteParams } from "@/app/helpers/utils";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ featureid: string }> }): Promise<Metadata> {
	const { featureid } = await decodeRouteParams(params);

	const feature = await trustedPrisma.feature.findUnique({
		where: {
			featureid
		},
		select: {
			id: true
		}
	});

	if (feature) {
		return {
			title: `${featureid} | ${TableMetadata.feature.plural}`
		};
	} else {
		return {
			title: "Feature not found"
		};
	}
}

const dataExplorerTabBase =
	"inline-flex min-h-9 items-center justify-center px-3 py-2 text-center text-sm font-medium transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 sm:min-h-10 sm:px-4 sm:py-2.5 sm:text-[0.9375rem]";

// Shared chrome so the sequence, taxonomy, assay and prevalence cards read as one family
const cardBase = "bg-base-200 rounded-xl p-5";
const cardHeading = "text-base sm:text-lg font-semibold text-base-content/80";
const taxonomyCardInfo = {
	description:
		"Taxonomies are ranked by how many assignments for this feature match each taxonomy. The most frequently assigned taxonomy appears first."
};
const prevalenceCardInfo = {
	description:
		"Top project prevalence is the percent of samples in the project with the most feature-positive samples that contain this feature. Overall prevalence is across all samples."
};

const calculateGcContent = (seq: string) => {
	if (!seq || seq.length === 0) return 0;
	let gcCount = 0;
	let totalBases = seq.length;
	for (const base of seq.toUpperCase()) {
		switch (base) {
			case "G":
			case "C":
			case "S":
				gcCount += 1;
				break;
			case "V":
			case "B":
				gcCount += 2 / 3;
				break;
			case "R":
			case "Y":
			case "M":
			case "K":
				gcCount += 0.5;
				break;
			case "D":
			case "H":
				gcCount += 1 / 3;
				break;
			case "N":
				totalBases--;
				break;
		}
	}
	if (totalBases === 0) return 0;
	return (gcCount / totalBases) * 100;
};

const formatPrevalencePercent = (percent: number) => (percent < 0.1 ? "< 0.1%" : `${percent.toFixed(1)}%`);

export default async function Featureid({
	params,
	searchParams
}: {
	params: Promise<{ featureid: string }>;
	searchParams: Promise<{ view?: string | string[] }>;
}) {
	const { featureid } = await decodeRouteParams(params);

	const { view } = await searchParams;
	if (view !== undefined) {
		redirect(exploreUrl({ table: "feature", featureid }));
	}

	const { feature, taxaCounts, assaySummaries } = await trustedPrisma.$transaction(async (tx) => {
		const feature = await tx.feature.findUnique({
			where: {
				featureid
			},
			include: {
				Assignments: {
					distinct: ["taxonomy"],
					select: {
						taxonomy: true,
						Taxonomy: true
					}
				},
				_count: {
					select: {
						Assignments: true
					}
				}
			}
		});

		const taxaCounts = [] as { taxonomy: string; count: number }[];
		if (feature) {
			for (const { taxonomy } of feature.Assignments) {
				taxaCounts.push({
					taxonomy,
					count: await tx.assignment.count({
						where: {
							taxonomy,
							featureid
						}
					})
				});
			}
		}

		const assignmentAssays = await tx.assignment.findMany({
			where: {
				featureid
			},
			select: {
				Analysis: {
					select: {
						assay_name: true,
						Assay: {
							select: {
								target_gene: true
							}
						}
					}
				}
			}
		});
		const uniqueAssays = assignmentAssays.reduce(
			(acc, a) => ({
				...acc,
				[a.Analysis.assay_name]: {
					target_gene: a.Analysis.Assay.target_gene
				}
			}),
			{} as Record<string, { target_gene: string }>
		);
		const assaySummaries = Object.entries(uniqueAssays).map(([assay_name, assay]) => ({
			assay_name,
			target_gene: assay.target_gene
		}));

		return { feature, taxaCounts, assaySummaries };
	});

	if (!feature) notFound();

	taxaCounts.sort((a, b) => b.count - a.count);
	const taxonomyById = new globalThis.Map(
		feature.Assignments.map((assignment) => [assignment.taxonomy, assignment.Taxonomy as Taxonomy | null])
	);
	const topTaxonomies = taxaCounts.slice(0, 5).map(({ taxonomy, count }) => {
		const details = taxonomyById.get(taxonomy) ?? null;
		return {
			taxonomy,
			count,
			details,
			displayName: details?.species || details?.genus || details?.taxonomy || taxonomy,
			hierarchy: details?.taxonomy || taxonomy
		};
	});
	const gcPercent = calculateGcContent(feature.dna_sequence);
	const totalAssignments = feature._count.Assignments || 0;
	const assignmentLabel = totalAssignments === 1 ? "assignment" : "assignments";

	return (
		<div id="feature" className="space-y-6 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/feature" className="text-primary hover:text-primary-focus">
							Features
						</Link>
					</li>
					<li>{feature.featureid}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<TitleHoverTooltip tooltip={TableMetadata.feature.description}>
						<h1 className="text-4xl font-semibold text-primary mb-2">{feature.featureid}</h1>
					</TitleHoverTooltip>
				</div>
				<p className="text-lg text-base-content/70 max-w-3xl">
					DNA sequence feature with {totalAssignments.toLocaleString()} {assignmentLabel}.
				</p>
			</header>

			<section className="mt-4 space-y-6">
				<div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
					{/* Map and sequence share the wider 5/8 column; the map absorbs any leftover height */}
					<div className="lg:col-span-5 flex flex-col gap-6">
						<Map
							query={() =>
								trustedPrisma.sample.findMany({
									where: {
										Libraries: {
											some: {
												Occurrences: {
													some: {
														featureid
													}
												}
											}
										}
									}
								})
							}
							cluster
							legend
							className="w-full min-h-96 flex-1 rounded-xl"
						/>

						{/* DNA sequence card */}
						<div className={cardBase}>
							<div className="mb-4">
								<h2 className={cardHeading}>DNA Sequence</h2>
							</div>
							<div className="inline-grid grid-cols-[auto_auto_auto] gap-x-6 gap-y-1 mb-4">
								<p className="text-xs font-semibold text-base-content/70">Length</p>
								<p className="text-xs font-semibold text-base-content/70">GC Content</p>
								<div className="row-span-2 self-center">
									<GcDonut percentage={gcPercent} size={74} strokeWidth={8} />
								</div>
								<p className="text-3xl leading-tight font-semibold text-base-content">
									{feature.sequenceLength_ODE}
									<span className="ml-1 text-base font-normal text-base-content/60">bp</span>
								</p>
								<p className="text-3xl leading-tight font-semibold text-base-content">{gcPercent.toFixed(1)}%</p>
							</div>
							<div className="rounded-lg bg-base-100/40 p-4">
								<div className="flex items-center justify-between gap-4">
									<p className="flex-1 min-w-0 font-mono text-base xl:text-lg leading-relaxed text-primary break-all">
										{feature.dna_sequence}
									</p>
									<CopyButton
										value={feature.dna_sequence}
										variant="icon"
										title="Copy DNA sequence"
										ariaLabel="Copy DNA sequence"
										className="self-center"
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="lg:col-span-3 flex flex-col gap-6">
						{/* Taxonomy card */}
						<div className={cardBase}>
							<div className="flex items-start justify-between gap-4 mb-4">
								<h2 className={cardHeading}>Top Taxonomy by Assignments</h2>
								<DashCardInfoButton info={taxonomyCardInfo} />
							</div>
							{topTaxonomies.length > 0 ? (
								<div className="divide-y divide-base-content/10">
									{topTaxonomies.map((taxa) => (
										<Link
											key={taxa.taxonomy}
											href={exploreUrl({ table: "taxonomy", taxonomy: taxa.taxonomy })}
											className="flex items-center gap-4 p-4 hover:bg-base-300/30 cursor-pointer transition-colors duration-150 group"
										>
											<div className="w-16 h-16 shrink-0 rounded-lg bg-linear-to-br from-base-200 to-base-300 group-hover:from-base-300 group-hover:to-base-200 flex items-center justify-center shadow-sm overflow-hidden transition-colors duration-150">
												<div className="relative w-12 h-12 flex items-center justify-center">
													{taxa.details ? (
														<PhyloPic taxonomy={taxa.details} />
													) : (
														<span className="text-xs text-base-content/55">No image</span>
													)}
												</div>
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-medium text-lg text-base-content leading-snug break-all">
													{taxa.displayName}
												</h3>
												<p className="text-xs text-base-content/60 break-all leading-snug">{taxa.hierarchy}</p>
											</div>
											<svg
												className="w-4 h-4 text-base-content/45 group-hover:text-base-content/75 transition-colors duration-150 shrink-0"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={2}
											>
												<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
											</svg>
										</Link>
									))}
								</div>
							) : (
								<p className="text-sm text-base-content/70">
									No taxonomy assignments are available for this feature yet.
								</p>
							)}
						</div>

						{/* Assay card */}
						<AssaysCard title="Assays used by this Feature" assays={assaySummaries} />

						{/* Prevalence graphs */}
						<div className={cardBase}>
							<div className="flex items-start justify-between gap-4 mb-6">
								<h2 className={cardHeading}>Feature Prevalence</h2>
								<DashCardInfoButton info={prevalenceCardInfo} />
							</div>
							<Suspense
								fallback={
									<div className="flex items-center justify-center gap-3 py-6">
										<span className="loading loading-spinner loading-md text-primary" />
										<span className="text-sm text-base-content/70">Loading prevalence…</span>
									</div>
								}
							>
								<FeaturePrevalenceSection featureid={feature.featureid} />
							</Suspense>
						</div>
					</div>
				</div>

				{/* Data tables with toggle */}
				<section className="space-y-4 mt-10">
					<h2 className="text-2xl font-semibold text-base-content/90 mb-3">Data Explorer</h2>
					<div role="tablist" aria-label="Feature data views" className="tabs bg-transparent gap-2 flex-wrap p-0">
						<input
							type="radio"
							name="featureDataTabs"
							role="tab"
							defaultChecked
							className={`tab border-none ${dataExplorerTabBase} bg-base-200/90 text-base-content hover:bg-base-300 checked:bg-primary checked:text-primary-content checked:shadow-md checked:hover:bg-primary checked:hover:brightness-95`}
							aria-label="Analyses"
						/>
						<div role="tabpanel" className="tab-content w-full mt-2">
							<Table table="analysis" where={{ Assignments: { some: { featureid } } }} defaultTake={20} />
						</div>

						<input
							type="radio"
							name="featureDataTabs"
							role="tab"
							className={`tab border-none ${dataExplorerTabBase} bg-base-200/90 text-base-content hover:bg-base-300 checked:bg-primary checked:text-primary-content checked:shadow-md checked:hover:bg-primary checked:hover:brightness-95`}
							aria-label="Occurrences"
						/>
						<div role="tabpanel" className="tab-content w-full mt-2">
							<Table table="occurrence" where={{ featureid }} defaultTake={20} />
						</div>

						<input
							type="radio"
							name="featureDataTabs"
							role="tab"
							className={`tab border-none ${dataExplorerTabBase} bg-base-200/90 text-base-content hover:bg-base-300 checked:bg-primary checked:text-primary-content checked:shadow-md checked:hover:bg-primary checked:hover:brightness-95`}
							aria-label="Assignments"
						/>
						<div role="tabpanel" className="tab-content w-full mt-2">
							<Table table="assignment" where={{ featureid }} defaultTake={20} />
						</div>
					</div>
				</section>
			</section>
		</div>
	);
}

async function FeaturePrevalenceSection({ featureid }: { featureid: string }) {
	const prevalenceData = await trustedPrisma.$transaction(async (tx) => {
		const totalSamplesCount = await tx.sample.count();

		const samplesWithFeature = await tx.sample.findMany({
			where: {
				Libraries: {
					some: {
						Occurrences: {
							some: {
								featureid
							}
						}
					}
				}
			},
			select: {
				samp_name: true,
				project_id: true
			}
		});

		const globalFeatureSamples = samplesWithFeature.length;

		const projectSampleCounts: Record<string, number> = {};
		for (const s of samplesWithFeature) {
			if (!s.project_id) continue;
			projectSampleCounts[s.project_id] = (projectSampleCounts[s.project_id] || 0) + 1;
		}

		const sortedProjects = Object.entries(projectSampleCounts).sort((a, b) => b[1] - a[1]);
		const [primaryProjectId, primaryProjectFeatureSamples] = sortedProjects[0] ?? [null, 0];

		let primaryProjectTotalSamples = 0;
		if (primaryProjectId) {
			primaryProjectTotalSamples = await tx.sample.count({
				where: {
					project_id: primaryProjectId
				}
			});
		}

		return {
			totalSamplesCount,
			globalFeatureSamples,
			primaryProjectId,
			primaryProjectFeatureSamples: typeof primaryProjectFeatureSamples === "number" ? primaryProjectFeatureSamples : 0,
			primaryProjectTotalSamples
		};
	});

	const {
		totalSamplesCount,
		globalFeatureSamples,
		primaryProjectId,
		primaryProjectFeatureSamples,
		primaryProjectTotalSamples
	} = prevalenceData;

	const globalPercent =
		totalSamplesCount && globalFeatureSamples ? (globalFeatureSamples / totalSamplesCount) * 100 : 0;
	const projectPercent =
		primaryProjectId && primaryProjectTotalSamples && primaryProjectFeatureSamples
			? (primaryProjectFeatureSamples / primaryProjectTotalSamples) * 100
			: 0;

	if (!globalFeatureSamples) {
		return (
			<div className="text-sm text-base-content/70">
				This feature has not been observed in any samples yet, so prevalence cannot be calculated.
			</div>
		);
	}

	const projectPercentLabel = formatPrevalencePercent(projectPercent);
	const globalPercentLabel = formatPrevalencePercent(globalPercent);

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
						Within top project
						{primaryProjectId ? (
							<>
								{" "}
								<span className="font-semibold text-base-content">{primaryProjectId}</span>
							</>
						) : null}
					</p>
					<p className="text-3xl font-bold text-primary mt-1">{projectPercentLabel}</p>
					{primaryProjectId ? (
						<p className="text-xs text-base-content/70 mt-1">
							{primaryProjectFeatureSamples.toLocaleString()} of {primaryProjectTotalSamples.toLocaleString()} samples
							in this project
						</p>
					) : (
						<p className="text-xs text-base-content/70 mt-1">
							Not enough information to calculate project-specific prevalence.
						</p>
					)}
				</div>
				<GcDonut percentage={projectPercent} size={64} strokeWidth={8} label={projectPercentLabel} />
			</div>

			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Across all samples</p>
					<p className="text-3xl font-bold text-primary mt-1">{globalPercentLabel}</p>
					<p className="text-xs text-base-content/70 mt-1">
						{globalFeatureSamples.toLocaleString()} of {totalSamplesCount.toLocaleString()} samples
					</p>
				</div>
				<GcDonut percentage={globalPercent} size={64} strokeWidth={8} label={globalPercentLabel} />
			</div>
		</div>
	);
}
