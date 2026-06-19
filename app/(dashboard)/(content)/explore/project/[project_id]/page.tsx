import { Suspense, type ReactNode } from "react";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Map from "@/app/components/map/Map";
import { randomColors } from "@/app/helpers/utils";
import EditHistory from "@/app/components/EditHistory";
import AssaysCard from "@/app/components/assay/AssaysCard";
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
import ProjectCoverPhotoPreview from "@/app/components/explore/ProjectCoverPhotoPreview";

/** Char budget per row (incl. ` | ` between segments). */
const INSTITUTION_MAX_CH = 98;
const INSTITUTION_PIPE_GAP_CH = 3;

function packInstitutionParts(parts: string[]): string[][] {
	const lines: string[][] = [];
	let cur: string[] = [];

	const lineLen = (segs: string[]) =>
		segs.length === 0
			? 0
			: segs.reduce((sum, s, i) => sum + s.length + (i > 0 ? INSTITUTION_PIPE_GAP_CH : 0), 0);

	for (const part of parts) {
		const nextLen =
			cur.length === 0 ? part.length : lineLen(cur) + INSTITUTION_PIPE_GAP_CH + part.length;
		if (cur.length > 0 && nextLen > INSTITUTION_MAX_CH) {
			lines.push(cur);
			cur = [part];
		} else {
			cur.push(part);
		}
	}
	if (cur.length) lines.push(cur);
	return lines;
}

function renderInstitutionPipeLine(partsLine: string[], keyPrefix: string): ReactNode[] {
	return partsLine.flatMap((part, i) => {
		const nodes: ReactNode[] = [];
		if (i > 0) {
			nodes.push(
				<span
					key={`${keyPrefix}-sep-${i}`}
					className="shrink-0 whitespace-nowrap px-1 text-base-content/45 select-none"
					aria-hidden="true"
				>
					|
				</span>
			);
		}
		const longPiece = part.length > INSTITUTION_MAX_CH;
		nodes.push(
			<span
				key={`${keyPrefix}-seg-${i}`}
				className={longPiece ? "min-w-0 max-w-[min(100%,98ch)] wrap-anywhere" : "whitespace-nowrap"}
			>
				{part}
			</span>
		);
		return nodes;
	});
}

function formatInstitutionHeaderBlock(institution: string | null | undefined): ReactNode {
	const raw = institution?.trim();
	if (!raw) {
		return (
			<div className="w-full min-w-0 space-y-1">
				<div className="flex flex-wrap items-start gap-x-1">
					<span className="font-medium text-base-content/70 shrink-0">Institution:</span>
					<span className="min-w-0 wrap-anywhere">N/A</span>
				</div>
			</div>
		);
	}
	const parts = raw.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
	if (parts.length === 0) {
		return (
			<div className="w-full min-w-0 space-y-1">
				<div className="flex flex-wrap items-start gap-x-1">
					<span className="font-medium text-base-content/70 shrink-0">Institution:</span>
					<span className="min-w-0 wrap-anywhere">N/A</span>
				</div>
			</div>
		);
	}
	if (parts.length === 1) {
		return (
			<div className="w-full min-w-0 space-y-1">
				<div className="flex flex-wrap items-start gap-x-1">
					<span className="font-medium text-base-content/70 shrink-0">Institution:</span>
					<span className="min-w-0 max-w-[min(100%,98ch)] flex-1 basis-0 wrap-anywhere whitespace-normal">
						{parts[0]}
					</span>
				</div>
			</div>
		);
	}

	const lines = packInstitutionParts(parts);
	return (
		<div className="w-full min-w-0 space-y-1">
			<div className="flex min-w-0 flex-wrap items-start gap-x-1">
				<span className="font-medium text-base-content/70 shrink-0">Institution:</span>
				<div className="flex min-w-0 flex-1 basis-0 flex-wrap content-start items-baseline gap-x-0">
					{renderInstitutionPipeLine(lines[0], "inst-l0")}
				</div>
			</div>
			{lines.slice(1).map((line, idx) => (
				<div
					key={`inst-cont-${idx}`}
					className="flex min-w-0 flex-wrap content-start items-baseline gap-x-0 text-base-content/80"
				>
					{renderInstitutionPipeLine(line, `inst-l${idx + 1}`)}
				</div>
			))}
		</div>
	);
}

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
	const assaySummaries = Object.entries(uniqueAssays).map(([assay_name, assay]) => ({
		assay_name,
		target_gene: assay.target_gene
	}));

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
	const hasCoverImage = Boolean(project.imageFileUrl_ODE);

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

	const assaysAndTaxa = (
		<div className="h-full flex flex-col gap-6">
			<AssaysCard id="assays-section" title="Assays in this Project" assays={assaySummaries} />

			{/* Top 2 Taxonomies per Assay */}
			<div>
				<h2 className="text-2xl font-semibold text-base-content/90 mb-3">Top 2 Taxonomies per Assay</h2>
				<div className="space-y-3">
					{Object.entries(topTaxaByAssay).map(([assay, taxa]) => (
						<a
							key={assay}
							href="#taxonomy-chart"
							className="block rounded-xl bg-base-200 hover:bg-base-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer"
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
										<div key={idx} className="relative h-7 rounded-full bg-base-100 overflow-hidden">
											<div
												className="absolute inset-y-0 left-0 bg-primary"
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
	);

	const mapDepthGrid = (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
			<div className="lg:col-span-2">
				<Map
					query={() => prisma.sample.findMany({ where: { project_id } })}
					where={{ project_id }}
					cluster
					legend
					draw
					legendOmit={["project_id"]}
					className="h-126 w-full min-h-136"
					defaultLegendField="expedition_id"
				/>
			</div>
			<div className="flex flex-col gap-6 lg:row-span-2">
				<Suspense fallback={<DepthCoverageCardSkeleton />}>
					<DepthCoverageCard projectId={project_id} />
				</Suspense>
				{assaysAndTaxa}
			</div>
			<div className="lg:col-span-2">
				<div className="bg-base-200 rounded-xl p-6 flex flex-col">
					<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Project Metadata</h2>
					<div className="max-h-124 overflow-y-auto">
						<DataDisplay table="project" data={justProject} omit={["project_id", "imageFileUrl_ODE"]} />
					</div>
				</div>
			</div>
		</div>
	);

	/* Matches ContentLayout widths so full-bleed heroes align foreground with the page column. */
	const contentColumnClass =
		"mx-auto w-[85%] max-w-[1536px] sm:w-[80%] md:w-[75%] lg:w-[75%] xl:w-[80%]";

	const breadcrumbsBlock = (
		<div className="text-base breadcrumbs mb-3">
			<ul>
				<li>
					<Link href="/explore/project" className="text-primary hover:text-primary-focus">
						Projects
					</Link>
				</li>
				<li>{project_id}</li>
			</ul>
		</div>
	);

	const headerBlock = (
		<header
			className={
				hasCoverImage ? "relative z-modal w-full min-w-0 max-w-full" : "w-full min-w-0 max-w-full"
			}
		>
			<div className="flex flex-wrap gap-x-3 gap-y-2 items-center justify-between">
				<div className="flex flex-wrap gap-2 items-center min-w-0">
					<h1
						className={
							hasCoverImage
								? "text-4xl font-semibold text-primary mb-0 tooltip tooltip-right drop-shadow-sm [html[data-theme='light']_&]:drop-shadow-md"
								: "text-4xl font-semibold text-primary mb-0 tooltip tooltip-right"
						}
						data-tip={TableMetadata.project.description}
					>
						{project.project_id}
					</h1>
					<EditHistory editHistory={project.editHistory} />
					{project.isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				{hasCoverImage && project.imageFileUrl_ODE ? (
					<ProjectCoverPhotoPreview
						src={project.imageFileUrl_ODE}
						title={project.project_name || project.project_id}
					/>
				) : null}
			</div>
			<p
				className={
					hasCoverImage
						? "text-2xl max-w-4xl mt-2 text-base-content/90 drop-shadow-sm [html[data-theme='dark']_&]:text-white"
						: "text-2xl max-w-4xl mt-2 text-base-content/90 [html[data-theme='dark']_&]:text-white"
				}
			>
				{project.project_name}
			</p>
			<div className="mt-1 w-full min-w-0 max-w-full text-sm text-base-content/80 space-y-1">
				<div className="flex flex-wrap gap-x-6 gap-y-1">
					<div>
						<span className="font-medium text-base-content/70">Contact: </span>
						<span>{project.project_contact || "N/A"}</span>
					</div>
					<div>
						<span className="font-medium text-base-content/70">Assay Type: </span>
						<span>{project.assay_type || "N/A"}</span>
					</div>
				</div>
				{formatInstitutionHeaderBlock(project.institution)}
			</div>
		</header>
	);

	const glanceBlock = (
		<div className="flex flex-col h-full">
			<h2 className="text-2xl font-semibold text-base-content/90 pb-2">Project at a Glance</h2>
			<div className="flex flex-wrap gap-3">
				<StatCard
					title="Samples"
					value={project._count.Samples}
					icon={<LocationIcon />}
					link={`/search?table=sample&advanced=[["project_id","equals","${project_id}"]]`}
					tooltip="View as Search"
					layout="horizontal"
					horizontalCardWidth="hug"
				/>
				<StatCard
					title="Analyses"
					value={project._count.Analyses}
					icon={<AnalysisIcon />}
					link={`/search?table=analysis&advanced=[["project_id","equals","${project_id}"]]`}
					tooltip="View as Search"
					layout="horizontal"
					horizontalCardWidth="hug"
				/>
				<StatCard
					title="Taxonomies"
					value={sortedTaxa.length}
					icon={<FishIcon />}
					link={`/search?table=taxonomy&advanced=[["project", "project_id","equals","${project_id}"]]`}
					tooltip="View as Search"
					layout="horizontal"
					horizontalCardWidth="hug"
				/>
				<StatCard
					title="Occurrences"
					value={project.Analyses.reduce((sum, a) => sum + a.Assignments.length, 0)}
					icon={<EyeIcon />}
					link={`/search?table=occurrence&advanced=[["project","project_id","equals","${project_id}"]]`}
					tooltip="View as Search"
					layout="horizontal"
					horizontalCardWidth="hug"
				/>
			</div>
		</div>
	);

	return (
		<div id="project" className="space-y-8">
			{hasCoverImage && project.imageFileUrl_ODE ? (
				<div
					className={[
						"relative isolate -mt-4 w-screen max-w-[100vw] shrink-0 overflow-x-clip overflow-y-clip pt-4 pb-10",
						"ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]"
					].join(" ")}
				>
					{/* Full-width page floor — photography only appears in the upper-right treatment */}
					<div className="pointer-events-none absolute inset-0 z-0 bg-base-100" aria-hidden />

					{/*
					 * Top-right hero: top-0 + section overflow-y-clip keeps art under the navbar; right offsets + mask/object-position unchanged otherwise.
					 */}
					<div
						className={[
							"absolute top-0 z-0 rounded-2xl",
							"-right-2 max-sm:-right-1 sm:-right-5",
							"h-[min(54vh,600px)] w-[min(96vw,1400px)] max-sm:w-[min(98vw,760px)] max-sm:h-[min(38vh,400px)]"
						].join(" ")}
					>
						<div
							className="relative h-full w-full overflow-hidden rounded-2xl"
							style={{
								WebkitMaskImage:
									"radial-gradient(ellipse 152% 138% at 86% 24%, rgba(0,0,0,1) 34%, rgba(0,0,0,0.52) 58%, rgba(0,0,0,0.14) 82%, rgba(0,0,0,0) 100%)",
								maskImage:
									"radial-gradient(ellipse 152% 138% at 86% 24%, rgba(0,0,0,1) 34%, rgba(0,0,0,0.52) 58%, rgba(0,0,0,0.14) 82%, rgba(0,0,0,0) 100%)"
							}}
						>
							<div className="absolute inset-0 pointer-events-none">
								<Image
									src={project.imageFileUrl_ODE}
									alt=""
									fill
									className="object-cover opacity-45 [html[data-theme='dark']_&]:opacity-55"
									style={{ objectPosition: "52% 42%" }}
									sizes="(max-width: 768px) 98vw, 96vw"
									priority
								/>
							</div>
							{/*
							 * Long, gentle blend into page bg (wider band than before).
							 * color-mix keeps intermediates theme-correct in light/dark.
							 */}
							<div
								className="pointer-events-none absolute inset-y-0 left-0"
								style={{
									width: "min(94%, 58rem)",
									background: `linear-gradient(
									90deg,
									var(--color-base-100) 0%,
									color-mix(in srgb, var(--color-base-100) 74%, transparent) 12%,
									color-mix(in srgb, var(--color-base-100) 46%, transparent) 32%,
									color-mix(in srgb, var(--color-base-100) 20%, transparent) 52%,
									color-mix(in srgb, var(--color-base-100) 6%, transparent) 72%,
									transparent 100%
								)`
								}}
								aria-hidden
							/>
							<div className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(44%,18rem)] bg-linear-to-t from-base-100 via-base-100/65 to-transparent" />
						</div>
					</div>
					<div className={`relative z-10 ${contentColumnClass} space-y-8`}>
						{breadcrumbsBlock}
						{headerBlock}
						{glanceBlock}
						{mapDepthGrid}
					</div>
				</div>
			) : (
				<div className="space-y-8">
					{breadcrumbsBlock}
					{headerBlock}
					{glanceBlock}
				</div>
			)}

			{/* No cover: map + depth/assays + metadata below. With cover, metadata sits under map inside mapDepthGrid. */}
			<section className="mt-2 space-y-8">
				{!hasCoverImage ? (
					/*
					 * No cover image: allow the right column to extend below the map
					 * without forcing the map taller. We do that by making a 2-row
					 * grid where the right column spans both rows.
					 */
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
						<div className="lg:col-span-2">
							<Map
								query={() => prisma.sample.findMany({ where: { project_id } })}
								where={{ project_id }}
								cluster
								legend
								draw
								legendOmit={["project_id"]}
								className="h-126 w-full min-h-136"
								defaultLegendField="expedition_id"
							/>
						</div>

						<div className="flex flex-col gap-6 lg:row-span-2">
							<Suspense fallback={<DepthCoverageCardSkeleton />}>
								<DepthCoverageCard projectId={project_id} />
							</Suspense>
							{assaysAndTaxa}
						</div>

						<div className="lg:col-span-2">
							<div className="bg-base-200 rounded-xl p-6 flex flex-col">
								<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Project Metadata</h2>
								<div className="max-h-124 overflow-y-auto">
									<DataDisplay table="project" data={justProject} omit={["project_id", "imageFileUrl_ODE"]} />
								</div>
							</div>
						</div>
					</div>
				) : null}
			</section>
		</div>
	);
}
