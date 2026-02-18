import TableMetadata from "@/types/tableMetadata";
import { Feature, Taxonomy } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { Suspense } from "react";
import Link from "next/link";
import PhyloPic from "@/app/components/images/PhyloPic";
import GcDonut from "@/app/components/charts/GcDonut";
import Table from "@/app/components/paginated/Table";
import { AssayIcon } from "@/app/components/icons";
import DropdownCard from "@/app/components/explore/DropdownCard";

export default async function Featureid({ params }: { params: Promise<{ featureid: Feature["featureid"] }> }) {
	let { featureid } = await params;
	featureid = decodeURIComponent(featureid);

	const { feature, taxaCounts, assays } = await prisma.$transaction(async (tx) => {
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
				},
				Occurrences: {
					where: {
						Analysis: {
							isPrivate: true
						}
					},
					select: {
						id: true
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
						assay_name: true
					}
				}
			}
		});
		const assays = [...new Set(assignmentAssays.map((a) => a.Analysis.assay_name))];

		return { feature, taxaCounts, assays };
	});

	if (!feature) return <>Feature not found</>;

	taxaCounts.sort((a, b) => b.count - a.count);
	const primaryTaxonomy = taxaCounts[0]?.taxonomy ?? null;
	const primaryTaxonomyDetails = primaryTaxonomy
		? (feature.Assignments.find((a) => a.taxonomy === primaryTaxonomy)?.Taxonomy as Taxonomy | null)
		: null;
	const primaryTaxonomyName =
		primaryTaxonomyDetails?.species ||
		primaryTaxonomyDetails?.genus ||
		primaryTaxonomyDetails?.taxonomy ||
		primaryTaxonomy ||
		null;
	const totalAssignments = feature._count.Assignments || 0;
	const assignmentLabel = totalAssignments === 1 ? "assignment" : "assignments";
	const isPrivate = !!feature.Occurrences.length;

	return (
		<div className="space-y-8 pb-8">
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
					<h1
						className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right"
						data-tip={TableMetadata.feature.description}
					>
						{feature.featureid}
					</h1>
					{isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				<p className="text-lg text-base-content/70 max-w-3xl">
					DNA sequence feature with {totalAssignments.toLocaleString()} {assignmentLabel}.
				</p>
			</header>

			<section className="mt-4 space-y-6">
				{/* DNA sequence on its own row */}
				<div className="space-y-2">
					<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">DNA sequence</p>
					<p className="font-mono text-2xl text-primary break-all">{feature.dna_sequence}</p>
					<div className="flex flex-wrap gap-6 text-sm text-base-content/70 mt-1">
						<span>
							<span className="font-semibold text-base-content">{feature.sequenceLength_ODE}</span> bp
						</span>
						<span>
							<span className="font-semibold text-base-content">{totalAssignments.toLocaleString()}</span>{" "}
							{assignmentLabel}
						</span>
					</div>
				</div>

				{/* Three-column layout: taxonomy, prevalence, assays */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Taxonomy card */}
					<div className="bg-base-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 h-full text-center">
						{primaryTaxonomyDetails ? (
							<>
								<div className="flex flex-col items-center gap-3">
									<div className="w-36 h-36 md:w-40 md:h-40 relative">
										<PhyloPic taxonomy={primaryTaxonomyDetails} />
									</div>
									{primaryTaxonomyDetails.taxonomy ? (
										<Link
											href={`/explore/taxonomy/${encodeURIComponent(primaryTaxonomyDetails.taxonomy)}`}
											className="text-lg font-semibold text-base-content hover:text-primary break-all"
										>
											{primaryTaxonomyName}
										</Link>
									) : (
										<p className="text-lg font-semibold text-base-content break-all">{primaryTaxonomyName}</p>
									)}
								</div>
								<div className="text-xs text-base-content/70 bg-base-200/70 rounded-md p-2 w-full">
									<span className="font-semibold uppercase tracking-wide mr-1">Taxonomy</span>
									<span className="break-all">{primaryTaxonomyDetails.taxonomy ?? primaryTaxonomy}</span>
								</div>
							</>
						) : (
							<p className="text-sm text-base-content/70 text-center">
								No taxonomy assignments are available for this feature yet.
							</p>
						)}
					</div>

					{/* Prevalence graphs (middle column) */}
					<div className="h-full">
						<Suspense
							fallback={
								<div className="bg-base-200 rounded-xl p-4 flex items-center justify-center gap-3 h-full">
									<span className="loading loading-spinner loading-md text-primary" />
									<span className="text-sm text-base-content/70">Loading prevalence…</span>
								</div>
							}
						>
							<div className="bg-base-200 rounded-xl p-4 h-full flex flex-col justify-center">
								<FeaturePrevalenceSection featureid={feature.featureid} />
							</div>
						</Suspense>
					</div>

					{/* Assay dropdown (right column) */}
					<div className="h-full flex items-start">
						<div className="w-3/4">
							<DropdownCard table="assay" items={assays} icon={<AssayIcon />} />
						</div>
					</div>
				</div>

				{/* Data tables with toggle */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold text-base-content/90">Data Explorer</h2>
					<div role="tablist" className="tabs tabs-lifted">
						<input
							type="radio"
							name="featureDataTabs"
							role="tab"
							className="tab"
							aria-label="Occurrences"
							defaultChecked
						/>
						<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
							<Table table="occurrence" where={{ featureid }} defaultTake={20} />
						</div>

						<input type="radio" name="featureDataTabs" role="tab" className="tab" aria-label="Assignments" />
						<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
							<Table table="assignment" where={{ featureid }} defaultTake={20} />
						</div>
					</div>
				</section>
			</section>
		</div>
	);
}

async function FeaturePrevalenceSection({ featureid }: { featureid: string }) {
	const prevalenceData = await prisma.$transaction(async (tx) => {
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

	return (
		<div className="flex flex-col gap-4">
			<div className="bg-base-200 rounded-lg p-4 flex items-center justify-between gap-4">
				<div>
					<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Across all samples</p>
					<p className="text-3xl font-bold text-primary mt-1">{globalPercent.toFixed(1)}%</p>
					<p className="text-xs text-base-content/70 mt-1">
						{globalFeatureSamples.toLocaleString()} of {totalSamplesCount.toLocaleString()} samples
					</p>
				</div>
				<GcDonut percentage={globalPercent} size={72} strokeWidth={8} />
			</div>

			<div className="bg-base-200 rounded-lg p-4 flex items-center justify-between gap-4">
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
					<p className="text-3xl font-bold text-primary mt-1">{projectPercent.toFixed(1)}%</p>
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
				<GcDonut percentage={projectPercent} size={72} strokeWidth={8} />
			</div>
		</div>
	);
}
