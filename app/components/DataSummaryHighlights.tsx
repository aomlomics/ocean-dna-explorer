import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { publicPrisma } from "@/app/helpers/prisma";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";
import DataSummaryCreatureCarousel, { type FeaturedCreature } from "./DataSummaryCreatureCarousel";
import DashCard, { DashCardInfoButton } from "./dataSummary/DashCard";
import { ProjectIcon, AnalysisIcon } from "@/app/components/icons";

const featuredCreatures: FeaturedCreature[] = [
	{
		id: "mobula-birostris",
		rank: "Species",
		taxonomyName: "Mobula birostris",
		commonName: "Giant Oceanic Manta Ray",
		description:
			"A wide-ranging plankton filter feeder often linked to productive ocean fronts and aggregation events.",
		taxonomyHref: "/explore/taxonomy/Mobula%20birostris",
		iucnStatus: "EN"
	},
	{
		id: "physeter-macrocephalus",
		rank: "Species",
		taxonomyName: "Physeter macrocephalus",
		commonName: "Sperm Whale",
		description: "A deep-diving apex predator whose eDNA signatures help indicate offshore ecosystem structure.",
		taxonomyHref: "/explore/taxonomy/Physeter%20macrocephalus",
		iucnStatus: "VU"
	},
	{
		id: "scomber-scombrus",
		rank: "Species",
		taxonomyName: "Scomber scombrus",
		commonName: "Atlantic Mackerel",
		description:
			"A schooling pelagic fish frequently observed in broad transects with strong seasonal movement patterns.",
		taxonomyHref: "/explore/taxonomy/Scomber%20scombrus",
		iucnStatus: "LC"
	},
	{
		id: "euphausiacea",
		rank: "Order",
		taxonomyName: "Euphausiacea",
		commonName: "Krill",
		description:
			"Key zooplankton grazers that transfer energy from phytoplankton to fish, seabirds, and marine mammals.",
		taxonomyHref: "/explore/taxonomy/Euphausiacea",
		iucnStatus: "NE"
	},
	{
		id: "thunnus-albacares",
		rank: "Species",
		taxonomyName: "Thunnus albacares",
		commonName: "Yellowfin Tuna",
		description:
			"A highly migratory predator often used as an indicator taxon for dynamic open-ocean food webs.",
		taxonomyHref: "/explore/taxonomy/Thunnus%20albacares",
		iucnStatus: "NT"
	},
	{
		id: "octopoda",
		rank: "Order",
		taxonomyName: "Octopoda",
		commonName: "Octopuses",
		description:
			"Cryptic benthic and pelagic cephalopods whose DNA traces can reveal hidden biodiversity hot spots.",
		taxonomyHref: "/explore/taxonomy/Octopoda",
		iucnStatus: "NE"
	}
];

function formatSubmitted(date: Date) {
	return new Date(date).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric"
	});
}

/** Small, label-less date display. Date is the hero, not the word "Submitted". */
function BigSubmittedDate({ date }: { date: Date }) {
	return (
		<time
			dateTime={new Date(date).toISOString()}
			className="text-lg sm:text-xl font-semibold text-base-content/85 tabular-nums whitespace-nowrap"
			title={`Submitted ${formatSubmitted(date)}`}
		>
			{formatSubmitted(date)}
		</time>
	);
}

/**
 * Compact assay chip — shrinks to the assay name so it doesn't stretch
 * across the whole card. Used in both project + analysis cards.
 */
function CompactAssayChip({
	assay_name,
	target_gene
}: {
	assay_name: string;
	target_gene: string;
}) {
	return (
		<Link
			href={`/explore/assay/${encodeURIComponent(assay_name)}`}
			className="group inline-flex items-center gap-2 rounded-lg bg-base-300/60 hover:bg-base-300 px-2 py-1.5 transition-colors max-w-full"
		>
			<div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
				<Suspense
					fallback={
						<span className="loading loading-spinner loading-xs text-primary/60" aria-hidden="true" />
					}
				>
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
	const [latestProject, latestAnalysis] = await Promise.all([
		publicPrisma.project.findFirst({
			orderBy: { dateSubmitted: "desc" },
			where: { isPrivate: false },
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
		publicPrisma.analysis.findFirst({
			orderBy: { dateSubmitted: "desc" },
			where: { isPrivate: false },
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
				<h2 className="text-2xl sm:text-3xl font-semibold text-base-content leading-tight">
					Latest submissions
				</h2>
			</div>

			{/*
			 * 12-col split: project card is the wider "hero" (col-span-7);
			 * analysis card is narrower (col-span-5) AND shorter since it has
			 * less content. The analysis-side column is a flex-col so another
			 * card could be stacked below it by the page layout if desired —
			 * but we keep it simple here and just let the grid row end where
			 * the project card ends.
			 */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
				<div className="lg:col-span-7">
					{latestProject ? (
						<LatestProjectCard project={latestProject} />
					) : (
						<EmptySubmissionCard label="project" />
					)}
				</div>
				<div className="lg:col-span-5 flex flex-col">
					{latestAnalysis ? (
						<LatestAnalysisCard analysis={latestAnalysis} />
					) : (
						<EmptySubmissionCard label="analysis" />
					)}
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
				<h2 className="text-2xl sm:text-3xl font-semibold text-base-content leading-tight">
					Featured Organisms
				</h2>
				<span
					className="tooltip tooltip-right text-base-content/50 hover:text-base-content transition-colors cursor-help"
					data-tip="Hand-picked by the ODE team"
					aria-label="Featured organisms are hand-picked by the ODE team"
				>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
						<circle cx="12" cy="12" r="9" />
						<path strokeLinecap="round" d="M12 8h.01M11 12h1v5h1" />
					</svg>
				</span>
			</div>
			<DataSummaryCreatureCarousel creatures={featuredCreatures} />
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
 * Latest Project Card — card-first design. The image is a small optional
 * thumbnail at the top of the card body; the card looks good whether or not
 * an image was submitted. No gradient scrim on the image.
 */
function LatestProjectCard({ project }: ProjectProps) {
	const hasImage = Boolean(project.imageFileUrl_ODE);
	const assays = dedupeAssays(
		project.AssayPreps.map((ap) => ({ assay_name: ap.assay_name, target_gene: ap.Assay.target_gene }))
	).slice(0, 4);

	return (
		<DashCard padding="none" className="overflow-hidden h-full">
			<div className="p-5 sm:p-6 flex flex-col gap-4 grow relative">
				{/* Header row — "Latest project" pill + info button */}
				<div className="flex items-center justify-between gap-3">
					<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/15">
						<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
						Latest project
					</span>
					<div className="flex items-center gap-2">
						{/* Boat icon (≈2.5:1) — give it width so it doesn't
						    squish into a square. */}
						<ProjectGlyph className="w-12 h-5 text-primary/40" />
						<DashCardInfoButton
							info={{
								title: "Most recent public project",
								description:
									"The newest project that has been publicly submitted to ODE. New submissions appear here within minutes.",
								links: [
									{ label: "View project", href: `/explore/project/${project.project_id}` },
									{ label: "Browse all projects", href: "/explore/project" }
								]
							}}
						/>
					</div>
				</div>

				{/*
				 * Optional thumbnail. Contained inside the card padding (not
				 * flush to card edges) and modestly sized — the card should
				 * read as a "project card with an image" not as an "image
				 * with a card below it". If there's no image, we show
				 * nothing here and the title takes the lead instead.
				 */}
				{hasImage && (
					<div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-base-300/40">
						<Image
							src={project.imageFileUrl_ODE as string}
							alt={project.project_name}
							fill
							className="object-cover"
							sizes="(max-width: 1024px) 100vw, 60vw"
						/>
					</div>
				)}

				{/* Row 1 — project_id (big, serves as name) + submitted date next to it */}
				<div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
					<h3
						className="text-2xl sm:text-3xl font-semibold text-base-content font-mono leading-tight tracking-tight break-all"
						title={project.project_id}
					>
						{project.project_id}
					</h3>
					<BigSubmittedDate date={project.dateSubmitted} />
				</div>

				<p className="text-lg sm:text-xl font-medium text-base-content/85 leading-snug line-clamp-2">
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
								<CompactAssayChip
									key={a.assay_name}
									assay_name={a.assay_name}
									target_gene={a.target_gene}
								/>
							))}
							{project.AssayPreps.length > assays.length && (
								<span className="self-center text-xs text-base-content/55">
									+{project.AssayPreps.length - assays.length} more
								</span>
							)}
						</div>
						<Link
							href={`/explore/project/${project.project_id}`}
							className="btn btn-sm btn-primary self-end"
						>
							View project
						</Link>
					</div>
				) : (
					<div className="mt-auto flex justify-end">
						<Link
							href={`/explore/project/${project.project_id}`}
							className="btn btn-sm btn-primary"
						>
							View project
						</Link>
					</div>
				)}
			</div>
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
		<DashCard padding="none" className="overflow-hidden">
			<div className="p-5 sm:p-6 flex flex-col gap-3 grow relative">
				{/* Laptop / analysis glyph in the top-right corner — same icon
				    used on the /submit page. */}
				<AnalysisGlyph className="absolute top-5 right-5 w-7 h-7 text-accent/40" />

				<div className="flex items-center gap-2 pr-10">
					<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent-focus border border-accent/20">
						<span className="w-1.5 h-1.5 rounded-full bg-accent-focus animate-pulse" />
						Latest analysis
					</span>
					<span
						className={[
							"inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold",
							analysis.trusted
								? "bg-emerald-500/10 text-emerald-500"
								: "bg-base-300/70 text-base-content/70"
						].join(" ")}
					>
						{analysis.trusted ? (
							<>
								<svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fillRule="evenodd"
										d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
										clipRule="evenodd"
									/>
								</svg>
								Trusted
							</>
						) : (
							"Unverified"
						)}
					</span>
					<span className="ml-auto">
						<DashCardInfoButton
							info={{
								title: "Most recent public analysis",
								description:
									"The newest analysis run to be publicly submitted. Trusted runs have been reviewed by the ODE team.",
								links: [
									{
										label: "View analysis",
										href: `/explore/analysis/${analysis.analysis_run_name}`
									},
									{
										label: "View parent project",
										href: `/explore/project/${analysis.project_id}`
									},
									{ label: "Browse all analyses", href: "/explore/analysis" }
								]
							}}
						/>
					</span>
				</div>

				<BigSubmittedDate date={analysis.dateSubmitted} />

				<h3 className="text-base sm:text-lg font-semibold text-base-content leading-snug break-all line-clamp-2 font-mono">
					{analysis.analysis_run_name}
				</h3>

				<dl className="text-xs space-y-2 grow">
					<div>
						<dt className="text-[10px] uppercase tracking-wider font-semibold text-base-content/50 mb-0.5">
							Project
						</dt>
						<dd>
							<Link
								href={`/explore/project/${analysis.project_id}`}
								className="text-base-content/85 hover:text-primary transition-colors inline-flex items-baseline gap-1.5 max-w-full"
								title={analysis.Project?.project_name || analysis.project_id}
							>
								<span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-base-300/70">
									{analysis.project_id}
								</span>
								{analysis.Project?.project_name && (
									<span className="truncate">{analysis.Project.project_name}</span>
								)}
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
						<dt className="text-[10px] uppercase tracking-wider font-semibold text-base-content/50 mb-1">
							Assay
						</dt>
						{/* Inline — chip does NOT stretch to full width */}
						<div className="flex">
							<CompactAssayChip
								assay_name={analysis.assay_name}
								target_gene={analysis.Assay.target_gene}
							/>
						</div>
					</div>
				</dl>

				{/* No divider line above the button. Tucked bottom-right. */}
				<div className="mt-auto flex justify-end">
					<Link
						href={`/explore/analysis/${analysis.analysis_run_name}`}
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
				No public {label} submissions yet.
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
