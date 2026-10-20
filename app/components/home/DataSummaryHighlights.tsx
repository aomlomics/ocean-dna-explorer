import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { trustedPrisma } from "@/app/helpers/prisma";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";
import FeaturedOrganisms from "../dataSummary/featuredOrganisms";
import DashCard, { DashCardInfoButton, type DashCardInfo } from "../dataSummary/DashCard";
import { AnalysisIcon, AssayIcon, ProjectIcon, TrustedIcon, UntrustedIcon } from "@/app/components/icons";
import InfoButton from "@/app/components/InfoButton";
import { exploreUrl } from "@/app/helpers/utils";
import SubmissionPager, { type SubmissionEntry } from "@/app/components/home/SubmissionPager";

function formatSubmitted(date: Date) {
	return new Date(date).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric"
	});
}

function CompactAssayChip({
	assay_name,
	target_gene,
	prominent = false
}: {
	assay_name: string;
	target_gene: string;
	prominent?: boolean;
}) {
	return (
		<Link
			href={exploreUrl({ table: "assay", assay_name })}
			className={
				prominent
					? "flex w-fit max-w-full items-center gap-2.5 rounded-lg bg-base-300/70 px-2.5 py-2 transition-colors hover:bg-base-300"
					: "flex w-fit max-w-full items-center gap-2 rounded-lg bg-base-300/60 px-2 py-1.5 transition-colors hover:bg-base-300"
			}
		>
			<span
				className={
					prominent
						? "relative flex size-12 shrink-0 items-center justify-center"
						: "relative flex size-8 shrink-0 items-center justify-center"
				}
			>
				<Suspense fallback={<span className="loading loading-spinner loading-xs text-primary/60" aria-hidden="true" />}>
					<AssayPhyloPic assay_name={assay_name} />
				</Suspense>
			</span>
			<span className={prominent ? "text-left text-base leading-snug" : "text-left text-sm leading-snug"}>
				<span className="font-semibold text-base-content">{target_gene}</span>
				<span className="text-base-content/40"> · </span>
				<span className="wrap-break-word text-base-content/75">{assay_name}</span>
			</span>
		</Link>
	);
}

const submissionOrder = [{ dateSubmitted: "desc" as const }, { id: "desc" as const }];

const projectSelect = {
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
} as const;

const analysisSelect = {
	analysis_run_name: true,
	project_id: true,
	assay_name: true,
	trusted: true,
	dateSubmitted: true,
	Assay: { select: { target_gene: true } },
	Project: { select: { project_name: true, institution: true } }
} as const;

function projectEntry(project: ProjectProps["project"]): SubmissionEntry {
	const info: DashCardInfo = {
		title: "Recent project",
		description: "Newest projects submitted to ODE, most recent first. The arrows load one older project at a time.",
		links: [
			{ label: "View project", href: exploreUrl({ table: "project", project_id: project.project_id }) },
			{ label: "Browse all projects", href: "/explore/project" }
		]
	};
	return {
		kind: "project",
		dateLabel: formatSubmitted(project.dateSubmitted),
		dateTime: project.dateSubmitted.toISOString(),
		card: <LatestProjectCard project={project} info={info} />
	};
}

function analysisEntry(analysis: AnalysisProps["analysis"]): SubmissionEntry {
	const info: DashCardInfo = {
		title: "Recent analysis",
		description:
			"Newest analysis runs submitted to ODE, most recent first. The arrows load one older analysis at a time. Trusted runs have been reviewed by the ODE team.",
		links: [
			{
				label: "View analysis",
				href: exploreUrl({
					table: "analysis",
					project_id: analysis.project_id,
					analysis_run_name: analysis.analysis_run_name
				})
			},
			{
				label: "View parent project",
				href: exploreUrl({ table: "project", project_id: analysis.project_id })
			},
			{ label: "Browse all analyses", href: "/explore/analysis" }
		]
	};
	return {
		kind: "analysis",
		dateLabel: formatSubmitted(analysis.dateSubmitted),
		dateTime: analysis.dateSubmitted.toISOString(),
		card: <LatestAnalysisCard analysis={analysis} info={info} />
	};
}

function validOffset(offset: number) {
	return Number.isInteger(offset) && offset >= 0;
}

async function readProjectSubmission(offset: number): Promise<SubmissionEntry | null> {
	if (!validOffset(offset)) return null;
	const project = await trustedPrisma.project.findFirst({
		orderBy: submissionOrder,
		skip: offset,
		select: projectSelect
	});
	return project ? projectEntry(project) : null;
}

async function readAnalysisSubmission(offset: number): Promise<SubmissionEntry | null> {
	if (!validOffset(offset)) return null;
	const analysis = await trustedPrisma.analysis.findFirst({
		orderBy: submissionOrder,
		skip: offset,
		select: analysisSelect
	});
	return analysis ? analysisEntry(analysis) : null;
}

async function loadProjectSubmission(offset: number) {
	"use server";
	return readProjectSubmission(offset);
}

async function loadAnalysisSubmission(offset: number) {
	"use server";
	return readAnalysisSubmission(offset);
}

export default async function DataSummaryHighlights() {
	const [project, analysis, projectTotal, analysisTotal] = await trustedPrisma.$transaction([
		trustedPrisma.project.findFirst({
			orderBy: submissionOrder,
			select: projectSelect
		}),
		trustedPrisma.analysis.findFirst({
			orderBy: submissionOrder,
			select: analysisSelect
		}),
		trustedPrisma.project.count(),
		trustedPrisma.analysis.count()
	]);

	return (
		<section className="w-full space-y-6">
			<h2 className="text-center text-2xl font-semibold leading-tight text-base-content sm:text-3xl">
				Latest Submissions
			</h2>

			<div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-6">
				{project ? (
					<SubmissionPager initial={projectEntry(project)} total={projectTotal} loadAt={loadProjectSubmission} />
				) : (
					<EmptySubmissionCard label="project" />
				)}
				{analysis ? (
					<SubmissionPager initial={analysisEntry(analysis)} total={analysisTotal} loadAt={loadAnalysisSubmission} />
				) : (
					<EmptySubmissionCard label="analysis" />
				)}
			</div>
		</section>
	);
}

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

function LatestProjectCard({ project, info }: ProjectProps & { info: DashCardInfo }) {
	const imageUrl = project.imageFileUrl_ODE;
	const assays = dedupeAssays(
		project.AssayPreps.map((ap) => ({ assay_name: ap.assay_name, target_gene: ap.Assay.target_gene }))
	);

	return (
		<div className="relative flex h-full flex-col">
			<div className="absolute top-3 right-3 z-20 rounded-full bg-base-200/90">
				<DashCardInfoButton info={info} />
			</div>
			<div className="relative h-36 w-full shrink-0 overflow-hidden sm:h-40">
				{imageUrl ? (
					<>
						<Image
							src={imageUrl}
							alt={project.project_name}
							fill
							className="object-cover"
							sizes="(min-width: 1024px) 40rem, 100vw"
						/>
						<div
							className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent from-40% to-base-200"
							aria-hidden
						/>
					</>
				) : (
					<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-base-300/40 text-base-content">
						<ProjectIcon className="size-14! h-14! w-14! text-base-content" />
						<span className="text-sm">No project image</span>
					</div>
				)}
			</div>
			<div className="flex flex-1 flex-col gap-3 px-5 pt-4 pb-5 text-left sm:px-6 sm:pb-6">
				<div className="flex items-start gap-3">
					<ProjectIcon className="size-10! h-10! w-10! shrink-0 text-primary" />
					<div className="min-w-0">
						<h3
							className="wrap-break-word text-xl font-semibold leading-tight tracking-tight text-base-content"
							title={project.project_id}
						>
							{project.project_id}
						</h3>
						<p className="mt-0.5 wrap-break-word text-base font-medium leading-snug text-base-content/80">
							{project.project_name}
						</p>
					</div>
				</div>

				<p className="line-clamp-3 text-sm leading-relaxed text-base-content/65">
					{project.projectDescription ?? "No project description was provided in this submission."}
				</p>

				<dl className="grid grid-cols-2 gap-3 text-xs">
					<div className="min-w-0">
						<dt className="mb-0.5 text-[10px] font-semibold tracking-wider text-base-content/70 uppercase">
							Institution
						</dt>
						<dd className="truncate text-base-content/85" title={project.institution ?? undefined}>
							{project.institution || "—"}
						</dd>
					</div>
					<div className="min-w-0">
						<dt className="mb-0.5 text-[10px] font-semibold tracking-wider text-base-content/70 uppercase">
							Assay type
						</dt>
						<dd className="truncate text-base-content/85">{project.assay_type || "—"}</dd>
					</div>
				</dl>

				<div>
					<AssayLabel plural={assays.length !== 1} />
					<div className="grid min-h-28 grid-cols-2 content-start justify-items-start gap-1.5">
						{assays.map((a) => (
							<CompactAssayChip key={a.assay_name} assay_name={a.assay_name} target_gene={a.target_gene} />
						))}
					</div>
				</div>
				<div className="mt-auto">
					<Link
						href={exploreUrl({ table: "project", project_id: project.project_id })}
						className="btn btn-sm btn-primary"
					>
						View project
					</Link>
				</div>
			</div>
		</div>
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

function LatestAnalysisCard({ analysis, info }: AnalysisProps & { info: DashCardInfo }) {
	const projectName = analysis.Project?.project_name;
	const institution = analysis.Project?.institution;

	return (
		<div className="relative flex h-full flex-col gap-4 px-5 pt-4 pb-5 text-left sm:px-6 sm:pb-6">
			<div className="absolute top-3 right-3 z-20 rounded-full bg-base-200/90">
				<DashCardInfoButton info={info} />
			</div>

			<div className="flex items-start gap-3 pr-10 pt-3">
				<AnalysisIcon className="mt-0.5 size-10! h-10! w-10! shrink-0 text-primary" />
				<h3 className="min-w-0 wrap-break-word text-3xl font-semibold leading-snug text-base-content">
					{analysis.analysis_run_name}
				</h3>
			</div>

			<div>
				<AssayLabel prominent />
				<CompactAssayChip
					assay_name={analysis.assay_name}
					target_gene={analysis.Assay.target_gene}
					prominent
				/>
			</div>

			<div className="min-w-0">
				<div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-wider text-base-content uppercase">
					<ProjectIcon className="size-6! h-6! w-6! shrink-0 text-base-content" />
					<span>Project</span>
				</div>
				<Link
					href={exploreUrl({ table: "project", project_id: analysis.project_id })}
					className="block min-w-0 transition-colors hover:text-primary"
					title={projectName || analysis.project_id}
				>
					<span className="block wrap-break-word text-base font-semibold leading-tight text-base-content">
						{analysis.project_id}
					</span>
					{projectName ? (
						<span className="mt-0.5 block wrap-break-word text-sm leading-snug text-base-content/60">
							{projectName}
						</span>
					) : null}
					{institution ? (
						<span className="mt-0.5 block text-xs leading-snug text-base-content/50">{institution}</span>
					) : null}
				</Link>
			</div>

			<div className="mt-auto flex items-center justify-between gap-3">
				<div className="inline-flex items-center gap-2.5 text-2xl font-semibold text-base-content">
					{analysis.trusted ? (
						<TrustedIcon className="size-11! h-11! w-11!" />
					) : (
						<UntrustedIcon className="size-11! h-11! w-11!" />
					)}
					{analysis.trusted ? "Trusted" : "Untrusted"}
				</div>
				<Link
					href={exploreUrl({
						table: "analysis",
						project_id: analysis.project_id,
						analysis_run_name: analysis.analysis_run_name
					})}
					className="btn btn-sm btn-primary"
				>
					View analysis
				</Link>
			</div>
		</div>
	);
}

function EmptySubmissionCard({ label }: { label: string }) {
	return (
		<DashCard className="w-full">
			<div className="h-44 sm:h-52 flex items-center justify-center text-sm text-base-content/60">
				No {label} submissions yet.
			</div>
		</DashCard>
	);
}

function AssayLabel({ prominent = false, plural = false }: { prominent?: boolean; plural?: boolean }) {
	return (
		<div
			className={
				prominent
					? "mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-base-content/70 uppercase"
					: "mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-base-content/70 uppercase"
			}
		>
			<AssayIcon
				className={
					prominent
						? "size-7! h-7! w-7! shrink-0 text-base-content"
						: "size-6! h-6! w-6! shrink-0 text-base-content"
				}
			/>
			{plural ? "Assays" : "Assay"}
		</div>
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
