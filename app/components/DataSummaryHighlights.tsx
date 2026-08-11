import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/app/helpers/prisma";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";
import FeaturedOrganisms from "./dataSummary/featuredOrganisms";
import DashCard, { DashCardInfoButton } from "./dataSummary/DashCard";
import { ProjectIcon, AnalysisIcon } from "@/app/components/icons";
import InfoButton from "@/app/components/InfoButton";

function formatSubmitted(date: Date) {
	return new Date(date).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric"
	});
}

function LatestStamp({ label, date }: { label: string; date: Date }) {
	return (
		<time
			dateTime={new Date(date).toISOString()}
			title={`Submitted ${formatSubmitted(date)}`}
			className="text-lg sm:text-xl font-semibold text-base-content/85 tabular-nums whitespace-nowrap"
		>
			<span className="text-primary font-normal">{label}</span>
			<span className="mx-2 text-base-content/35 font-semibold" aria-hidden="true">
				·
			</span>
			<span className="text-base-content/85">{formatSubmitted(date)}</span>
		</time>
	);
}

/**
 * Compact assay chip — shrinks to the assay name so it doesn't stretch
 * across the whole card. Used in both project + analysis cards.
 */
function CompactAssayChip({ assay_name, target_gene }: { assay_name: string; target_gene: string }) {
	return (
		<Link
			href={`/explore/assay/${encodeURIComponent(assay_name)}`}
			className="group inline-flex items-center gap-2 rounded-lg bg-base-300/60 hover:bg-base-300 px-2 py-1.5 transition-colors max-w-full"
		>
			<div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
				<Suspense fallback={<span className="loading loading-spinner loading-xs text-primary/60" aria-hidden="true" />}>
					<AssayPhyloPic assay_name={assay_name} />
				</Suspense>
			</div>
			<div className="flex items-center gap-1.5 text-xs min-w-0">
				<span className="font-semibold text-base-content truncate">{target_gene}</span>
				<span className="text-base-content/40">·</span>
				<span className="text-base-content/65 truncate">{assay_name}</span>
			</div>
		</Link>
	);
}

/**
 * Header glyphs — same icons used on the /submit page so the visual
 * language is consistent. ProjectIcon is the boat (≈2.5:1 aspect ratio,
 * so we give it a wide w-12 by default) and AnalysisIcon is the laptop
 * with a chart (1:1).
 */
function ProjectGlyph({ className = "" }: { className?: string }) {
	return <ProjectIcon className={["shrink-0", className].join(" ")} />;
}

function AnalysisGlyph({ className = "" }: { className?: string }) {
	return <AnalysisIcon className={["shrink-0", className].join(" ")} />;
}

export default async function DataSummaryHighlights() {
	const [latestProject, latestAnalysis] = await prisma.$transaction([
		prisma.project.findFirst({
			orderBy: { dateSubmitted: "desc" },
			select: {
				project_id: true,
				project_name: true,
				institution: true,
				assay_type: true,
				dateSubmitted: true,
				projectDescription: true,
				imageFileUrl_ODE: true,
				AssayPreps: {
					select: {
						assay_name: true,
						Assay: { select: { target_gene: true } }
					}
				}
			}
		}),
		prisma.analysis.findFirst({
			orderBy: { dateSubmitted: "desc" },
			select: {
				analysis_run_name: true,
				project_id: true,
				assay_name: true,
				trusted: true,
				dateSubmitted: true,
				Assay: { select: { target_gene: true } },
				Project: { select: { project_name: true, institution: true } }
			}
		})
	]);

	return (
		<section className="space-y-6">
			<div>
				<h2 className="text-2xl sm:text-3xl font-semibold text-base-content leading-tight">Latest Submissions</h2>
			</div>

			{/*
			 * 12-col split: project card is the wider "hero" (col-span-8);
			 * analysis card is narrower (col-span-4) AND shorter since it has
			 * less content. The analysis-side column is a flex-col so another
			 * card could be stacked below it by the page layout if desired —
			 * but we keep it simple here and just let the grid row end where
			 * the project card ends.
			 */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				<div className="lg:col-span-8">
					{latestProject ? <LatestProjectCard project={latestProject} /> : <EmptySubmissionCard label="project" />}
				</div>
				<div className="lg:col-span-4 flex flex-col">
					{latestAnalysis ? <LatestAnalysisCard analysis={latestAnalysis} /> : <EmptySubmissionCard label="analysis" />}
				</div>
			</div>
		</section>
	);
}

/**
 * Separate export for Featured Organisms — rendered independently on the
 * page so its position is fully controlled by the page layout.
 */
export function FeaturedOrganismsSection() {
	return (
		<section className="space-y-6">
			<div className="flex items-center gap-2">
				<h2 className="text-2xl sm:text-3xl font-semibold text-base-content leading-tight">Featured Organisms</h2>
				<InfoButton text="Hand-picked by the ODE team" dir="tooltip-right" />
			</div>
			<FeaturedOrganisms />
		</section>
	);
}

type ProjectProps = {
	project: {
		project_id: string;
		project_name: string;
		institution: string | null;
		assay_type: string;
		dateSubmitted: Date;
		projectDescription: string | null;
		imageFileUrl_ODE: string | null;
		AssayPreps: { assay_name: string; Assay: { target_gene: string } }[];
	};
};

/**
 * Latest Project Card — optional full-width image band at the top with the same
 * gradient into base-200 as Life Across ODE; body follows below in padded layout.
 */
function LatestProjectCard({ project }: ProjectProps) {
	const hasImage = Boolean(project.imageFileUrl_ODE);
	const assays = dedupeAssays(
		project.AssayPreps.map((ap) => ({ assay_name: ap.assay_name, target_gene: ap.Assay.target_gene }))
	).slice(0, 4);

	return (
		<DashCard padding="none" className="h-full">
			<>
				{hasImage && (
					<div className="relative h-48 w-full overflow-hidden rounded-t-2xl shrink-0 sm:h-52">
						<Image
							src={project.imageFileUrl_ODE as string}
							alt={project.project_name}
							fill
							className="object-cover"
							sizes="(max-width: 1024px) 100vw, 58vw"
						/>
						{/*
						 * Faded gradient so the image softly bleeds into the card
						 * body rather than ending on a hard horizontal line.
						 * Fade target is base-200 (the card color) so the fade blends
						 * with the DashCard body below — same language as kingdom cards.
						 */}
						<div
							className="absolute inset-0 pointer-events-none bg-linear-to-b from-transparent to-base-200"
							aria-hidden
						/>
					</div>
				)}
				<div
					className={[
						"flex flex-col grow relative",
						hasImage
							? "-mt-7 sm:-mt-8 z-10 rounded-t-2xl rounded-b-2xl bg-base-200 px-5 sm:px-6 pt-3 sm:pt-3.5 pb-5 sm:pb-6 gap-2"
							: "p-5 sm:p-6 gap-3"
					].join(" ")}
				>
					{/* Header row — glyph + submission stamp; info button right */}
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3 min-w-0">
							{/* Boat icon (≈2.5:1) — give it width so it doesn't
							    squish into a square. */}
							<ProjectGlyph className="w-14 h-6 text-primary" />
							<LatestStamp label="Project" date={project.dateSubmitted} />
						</div>
						<DashCardInfoButton
							info={{
								title: "Most recent project",
								description:
									"The newest project that has been submitted to ODE. New submissions appear here within minutes.",
								links: [
									{ label: "View project", href: `/explore/project/${encodeURIComponent(project.project_id)}` },
									{ label: "Browse all projects", href: "/explore/project" }
								]
							}}
						/>
					</div>

					{/* Row 1 — project_id (big, serves as name) + submitted date next to it */}
					<div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
						<h3
							className="text-2xl sm:text-3xl font-semibold text-base-content leading-tight tracking-tight break-all"
							title={project.project_id}
						>
							{project.project_id}
						</h3>
					</div>

					<p className="text-lg sm:text-xl font-medium text-base-content leading-snug line-clamp-2">
						{project.project_name}
					</p>

					<p className="text-sm text-base-content/65 leading-relaxed line-clamp-3">
						{project.projectDescription ?? "No project description was provided in this submission."}
					</p>

					<dl className="grid grid-cols-2 gap-3 text-xs">
						{project.institution && (
							<div>
								<dt className="text-[10px] uppercase tracking-wider font-semibold text-base-content/50 mb-0.5">
									Institution
								</dt>
								<dd className="text-base-content/85 truncate" title={project.institution}>
									{project.institution}
								</dd>
							</div>
						)}
						{project.assay_type && (
							<div>
								<dt className="text-[10px] uppercase tracking-wider font-semibold text-base-content/50 mb-0.5">
									Assay type
								</dt>
								<dd className="text-base-content/85 truncate">{project.assay_type}</dd>
							</div>
						)}
					</dl>

					{assays.length > 0 ? (
						<div className="mt-auto flex flex-wrap items-end justify-between gap-3">
							<div className="flex flex-wrap gap-1.5 min-w-0">
								{assays.map((a) => (
									<CompactAssayChip key={a.assay_name} assay_name={a.assay_name} target_gene={a.target_gene} />
								))}
								{project.AssayPreps.length > assays.length && (
									<span className="self-center text-xs text-base-content/55">
										+{project.AssayPreps.length - assays.length} more
									</span>
								)}
							</div>
							<Link
								href={`/explore/project/${encodeURIComponent(project.project_id)}`}
								className="btn btn-sm btn-primary self-end"
							>
								View project
							</Link>
						</div>
					) : (
						<div className="mt-auto flex justify-end">
							<Link
								href={`/explore/project/${encodeURIComponent(project.project_id)}`}
								className="btn btn-sm btn-primary"
							>
								View project
							</Link>
						</div>
					)}
				</div>
			</>
		</DashCard>
	);
}

type AnalysisProps = {
	analysis: {
		analysis_run_name: string;
		project_id: string;
		assay_name: string;
		trusted: boolean;
		dateSubmitted: Date;
		Assay: { target_gene: string };
		Project: { project_name: string; institution: string | null } | null;
	};
};

/**
 * Latest Analysis Card — intentionally shorter than the project card since
 * it has less information. No left-side stripe. Big submission date on top.
 * The assay chip is inline (shrinks to content) instead of full width.
 */
function LatestAnalysisCard({ analysis }: AnalysisProps) {
	return (
		<DashCard padding="none">
			<div className="p-5 sm:p-6 flex flex-col gap-3 grow relative">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						{/* Laptop / analysis glyph — same icon used on the /submit page. */}
						<AnalysisGlyph className="w-8 h-8 text-primary" />
						<LatestStamp label="Analysis" date={analysis.dateSubmitted} />
						{/* Keep "Trusted" only when applicable; remove noisy "Unverified". */}
						{analysis.trusted && (
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 whitespace-nowrap">
								<svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fillRule="evenodd"
										d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
										clipRule="evenodd"
									/>
								</svg>
								Trusted
							</span>
						)}
					</div>
					<DashCardInfoButton
						info={{
							title: "Most recent analysis",
							description: "The newest analysis run to be submitted. Trusted runs have been reviewed by the ODE team.",
							links: [
								{
									label: "View analysis",
									href: `/explore/analysis/${encodeURIComponent(analysis.project_id)}/${encodeURIComponent(analysis.analysis_run_name)}`
								},
								{
									label: "View parent project",
									href: `/explore/project/${encodeURIComponent(analysis.project_id)}`
								},
								{ label: "Browse all analyses", href: "/explore/analysis" }
							]
						}}
					/>
				</div>

				<h3 className="text-base sm:text-lg font-semibold text-base-content leading-snug break-all line-clamp-2">
					{analysis.analysis_run_name}
				</h3>

				<dl className="text-xs space-y-2 grow">
					<div>
						<dt className="text-[10px] uppercase tracking-wider font-semibold text-base-content/50 mb-0.5">Project</dt>
						<dd>
							<Link
								href={`/explore/project/${encodeURIComponent(analysis.project_id)}`}
								className="text-base-content/85 hover:text-primary transition-colors inline-flex items-baseline gap-1.5 max-w-full"
								title={analysis.Project?.project_name || analysis.project_id}
							>
								<span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-base-300/70">
									{analysis.project_id}
								</span>
								{analysis.Project?.project_name && <span className="truncate">{analysis.Project.project_name}</span>}
							</Link>
						</dd>
					</div>
					{analysis.Project?.institution && (
						<div>
							<dt className="text-[10px] uppercase tracking-wider font-semibold text-base-content/50 mb-0.5">
								Institution
							</dt>
							<dd className="text-base-content/85 truncate" title={analysis.Project.institution}>
								{analysis.Project.institution}
							</dd>
						</div>
					)}
					<div>
						<dt className="text-[10px] uppercase tracking-wider font-semibold text-base-content/50 mb-1">Assay</dt>
						{/* Inline — chip does NOT stretch to full width */}
						<div className="flex">
							<CompactAssayChip assay_name={analysis.assay_name} target_gene={analysis.Assay.target_gene} />
						</div>
					</div>
				</dl>

				{/* No divider line above the button. Tucked bottom-right. */}
				<div className="mt-auto flex justify-start">
					<Link
						href={`/explore/analysis/${encodeURIComponent(analysis.analysis_run_name)}`}
						className="btn btn-sm btn-primary"
					>
						View analysis
					</Link>
				</div>
			</div>
		</DashCard>
	);
}

function EmptySubmissionCard({ label }: { label: string }) {
	return (
		<DashCard>
			<div className="h-44 sm:h-52 flex items-center justify-center text-sm text-base-content/60">
				No {label} submissions yet.
			</div>
		</DashCard>
	);
}

function dedupeAssays<T extends { assay_name: string }>(list: T[]): T[] {
	const seen = new Set<string>();
	const out: T[] = [];
	for (const a of list) {
		if (seen.has(a.assay_name)) continue;
		seen.add(a.assay_name);
		out.push(a);
	}
	return out;
}
