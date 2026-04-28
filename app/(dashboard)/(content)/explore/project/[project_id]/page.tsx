import { Suspense } from "react";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Map from "@/app/components/map/Map";
import { randomColors } from "@/app/helpers/utils";
import EditHistory from "@/app/components/EditHistory";
import AssayCard from "@/app/components/assay/AssayCard";
import DataDisplay from "@/app/components/DataDisplay";
import TableMetadata from "@/types/tableMetadata";
import { Project } from "@/app/generated/prisma/client";
import StatCard from "@/app/components/explore/StatCard";
import { LocationIcon, AnalysisIcon, FishIcon, EyeIcon } from "@/app/components/icons";
import Image from "next/image";
import {
	DepthCoverageCard,
	DepthCoverageCardSkeleton
} from "@/app/components/dataSummary/DepthCoverageCard";

export default async function Project_id({ params }: { params: Promise<{ project_id: Project["project_id"] }> }) {
	let { project_id } = await params;
	project_id = decodeURIComponent(project_id);

	const project = await prisma.project.findUnique({
		where: {
			project_id
		},
		include: {
			_count: {
				select: {
					Samples: true,
					Analyses: true
				}
			},
			Analyses: {
				select: {
					analysis_run_name: true,
					assay_name: true,
					Assay: {
						select: {
							target_gene: true
						}
					},
					Assignments: {
						select: {
							taxonomy: true
						}
					}
				}
			}
		}
	});
	if (!project) return <>Project not found</>;
	const { _count: _, Analyses: ___, editHistory: ____, ...justProject } = project;

	const uniqueAssays = project.Analyses.reduce(
		(acc: Record<string, Record<string, string>>, a) => ({
			...acc,
			[a.assay_name]: { target_gene: a.Assay.target_gene }
		}),
		{}
	);

	//get a sorted array of taxonomy counts, and a separate object to show which analysis taxonomies came from
	const taxaCount = {} as Record<string, number>;
	const taxaCountByAnalysis = {} as Record<string, Record<string, number>>;
	const taxaCountByAssay = {} as Record<string, Record<string, number>>;

	for (const a of project.Analyses) {
		taxaCountByAnalysis[a.analysis_run_name] = {};
		if (!taxaCountByAssay[a.assay_name]) {
			taxaCountByAssay[a.assay_name] = {};
		}

		for (const assign of a.Assignments) {
			if (assign.taxonomy in taxaCount) {
				taxaCount[assign.taxonomy] += 1;
			} else {
				taxaCount[assign.taxonomy] = 1;
			}

			if (assign.taxonomy in taxaCountByAnalysis[a.analysis_run_name]) {
				taxaCountByAnalysis[a.analysis_run_name][assign.taxonomy] += 1;
			} else {
				taxaCountByAnalysis[a.analysis_run_name][assign.taxonomy] = 1;
			}

			if (assign.taxonomy in taxaCountByAssay[a.assay_name]) {
				taxaCountByAssay[a.assay_name][assign.taxonomy] += 1;
			} else {
				taxaCountByAssay[a.assay_name][assign.taxonomy] = 1;
			}
		}
	}
	const colorsArr = randomColors(Object.keys(taxaCountByAnalysis).length);
	const sortedTaxa = Object.entries(taxaCount).sort(([, a], [, b]) => b - a);

	// Get top 2 taxonomies per assay
	const topTaxaByAssay = Object.entries(taxaCountByAssay).reduce(
		(acc, [assay, taxa]) => {
			const sortedAssayTaxa = Object.entries(taxa)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 2)
				.map(([taxonomy, count]) => {
					const taxonomyParts = taxonomy.split(";").filter(Boolean);
					const displayName = taxonomyParts[taxonomyParts.length - 1]?.trim() || "Unknown";
					const totalAssayCount = Object.values(taxa).reduce((sum, c) => sum + c, 0);
					const percentage = ((count / totalAssayCount) * 100).toFixed(1);
					return { displayName, count, percentage };
				});
			acc[assay] = sortedAssayTaxa;
			return acc;
		},
		{} as Record<string, Array<{ displayName: string; count: number; percentage: string }>>
	);

	return (
		<div id="project" className="space-y-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs mb-4">
				<ul>
					<li>
						<Link href="/explore/project" className="text-primary hover:text-primary-focus">
							Projects
						</Link>
					</li>
					<li>{project_id}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<h1
						className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right"
						data-tip={TableMetadata.project.description}
					>
						{project.project_id}
					</h1>
					<EditHistory editHistory={project.editHistory} />
					{project.isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				<p className="text-lg text-base-content/70 max-w-4xl">{project.project_name}</p>

				{/* Compact project information under the description */}
				<div className="text-sm text-base-content/80 flex flex-wrap gap-x-6 gap-y-1">
					<div>
						<span className="font-medium text-base-content/70">Contact: </span>
						<span>{project.project_contact || "N/A"}</span>
					</div>
					<div>
						<span className="font-medium text-base-content/70">Institution: </span>
						<span>{project.institution || "N/A"}</span>
					</div>
					<div>
						<span className="font-medium text-base-content/70">Assay Type: </span>
						<span>{project.assay_type || "N/A"}</span>
					</div>
				</div>
			</header>

			<div className="flex flex-col h-full">
				<h2 className="text-2xl font-semibold text-base-content/90 pb-2">Project at a Glance</h2>

				{/* Stat cards */}
				<div className="grid grid-cols-4 gap-4">
					<StatCard
						title="Samples"
						value={project._count.Samples}
						icon={<LocationIcon />}
						link={`/search?table=sample&advanced=[["project_id","equals","${project_id}"]]`}
						tooltip="View as Search"
						layout="horizontal"
					/>
					<StatCard
						title="Analyses"
						value={project._count.Analyses}
						icon={<AnalysisIcon />}
						link={`/search?table=analysis&advanced=[["project_id","equals","${project_id}"]]`}
						tooltip="View as Search"
						layout="horizontal"
					/>
					<StatCard
						title="Taxonomies"
						value={sortedTaxa.length}
						icon={<FishIcon />}
						link={`/search?table=taxonomy&advanced=[["project", "project_id","equals","${project_id}"]]`}
						tooltip="View as Search"
						layout="horizontal"
					/>
					<StatCard
						title="Occurrences"
						value={project.Analyses.reduce((sum, a) => sum + a.Assignments.length, 0)}
						icon={<EyeIcon />}
						link={`/search?table=occurrence&advanced=[["project","project_id","equals","${project_id}"]]`}
						tooltip="View as Search"
						layout="horizontal"
					/>
				</div>
			</div>

			{/* Map + stats + below-map content grouped so spacing between map and metadata is consistent */}
			<section className="mt-2 space-y-8">
				{/* Top layout: Map and Cover image */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
					{/* Left: Map */}
					<div className="lg:col-span-2 h-full">
						<Map
							query={() => prisma.sample.findMany({ where: { project_id } })}
							where={{ project_id }}
							cluster
							legend
							draw
							legendOmit={["project_id"]}
							className="h-full w-full min-h-80"
							defaultLegendField="expedition_id"
						/>
					</div>

					{/*
					 * Right column: optional half-height cover image stacked
					 * over the project's depth-coverage card. When there's no
					 * cover image, the depth card stands in for it. This keeps
					 * the right column always populated so the layout below
					 * (project metadata + assays grid) lines up consistently.
					 */}
					<div className="flex flex-col gap-4 h-full min-h-80">
						{project.imageFileUrl_ODE && (
							<div className="relative w-full aspect-2/1 rounded-md overflow-hidden bg-base-300/40 shrink-0">
								<Image
									src={project.imageFileUrl_ODE}
									alt={`Cover image for the ${project.project_id} project.`}
									fill
									className="object-cover"
									sizes="(max-width: 1024px) 100vw, 33vw"
								/>
							</div>
						)}
						<div className="flex-1 flex flex-col">
							<Suspense fallback={<DepthCoverageCardSkeleton />}>
								<DepthCoverageCard projectId={project_id} />
							</Suspense>
						</div>
					</div>
				</div>

				{/* Below-map layout: Project metadata on the left, Assays + Top Taxonomies on the right */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Project Metadata Table (aligned with map width) */}
					<div className="lg:col-span-2">
						<div className="bg-base-200 rounded-xl p-6 flex flex-col">
							<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Project Metadata</h2>
							<div className="max-h-124 overflow-y-auto">
								<DataDisplay table="project" data={justProject} omit={["project_id", "imageFileUrl_ODE"]} />
							</div>
						</div>
					</div>

					{/* Assays and Top Taxonomies (right half) */}
					<div className="h-full flex flex-col gap-6">
						{/* Assays Section (kept visually the same, just above Top Taxonomies) */}
						<div id="assays-section">
							<h2 className="text-2xl font-semibold text-base-content/90 mb-4">
								Assays in this Project ({Object.keys(uniqueAssays).length})
							</h2>
							<div className="space-y-2">
							{Object.keys(uniqueAssays).map((assay) => (
								<AssayCard
									key={assay}
									assay_name={assay}
									target_gene={uniqueAssays[assay].target_gene}
								/>
							))}
							</div>
						</div>

						{/* Top 2 Taxonomies per Assay */}
						<div className="flex-1">
							<h2 className="text-2xl font-semibold text-base-content/90 mb-3">Top 2 Taxonomies per Assay</h2>
							<div className="space-y-3">
								{Object.entries(topTaxaByAssay).map(([assay, taxa]) => (
									<a
										key={assay}
										href="#taxonomy-chart"
										className="block rounded-xl bg-base-200 hover:bg-base-200/80 hover:border-primary/60 shadow-sm hover:shadow-md transition-all cursor-pointer"
									>
										<div className="px-4 py-3 space-y-2">
											<div className="flex flex-col gap-0.5">
												<h3 className="font-medium text-base-content text-sm leading-snug">
													{uniqueAssays[assay].target_gene}
												</h3>
												<p className="text-xs text-base-content/60 truncate">{assay}</p>
											</div>
											<div className="space-y-1">
												{taxa.map((taxon, idx) => (
													<div key={idx} className="relative h-7 rounded-full bg-base-300/80 overflow-hidden">
														<div
															className="absolute inset-y-0 left-0 bg-primary/15"
															style={{ width: `${taxon.percentage}%` }}
														/>
														<div className="relative flex h-full items-center justify-between px-2 text-[0.7rem]">
															<span className="text-base-content/80 truncate">{taxon.displayName}</span>
															<span className="text-base-content/60 whitespace-nowrap">
																{taxon.percentage}% ({taxon.count})
															</span>
														</div>
													</div>
												))}
											</div>
										</div>
									</a>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
