import { publicPrisma } from "@/app/helpers/prisma";
import DashCard from "./dashboard/DashCard";

/**
 * ---------------------------------------------------------------------------
 * Individual, real-data dashboard widgets
 * ---------------------------------------------------------------------------
 * Each widget is its own async server component so the page can arrange them
 * newspaper-style — alongside the map, stacked under Target Genes, in their
 * own rows, etc. — without one giant "widget row" dictating the layout.
 *
 * Every query is a single COUNT / GROUP BY / AGGREGATE pass against a single
 * table and uses publicPrisma (which already filters isPrivate=false), so
 * they're cheap even on a large dataset.
 * ---------------------------------------------------------------------------
 */

// --------------------------- Top Institutions ----------------------------
export async function TopInstitutionsCard() {
	const rows = await publicPrisma.project.groupBy({
		by: ["institution"],
		where: { institution: { not: null } },
		_count: { project_id: true },
		orderBy: { _count: { project_id: "desc" } },
		take: 5
	});
	const institutions = rows
		.filter((r) => r.institution)
		.map((r) => ({ name: r.institution as string, count: r._count.project_id }));

	return (
		<DashCard
			title="Top institutions"
			subtitle="By submitted public projects"
			padding="md"
			info={{
				title: "Top institutions",
				description:
					"Counts the number of public projects submitted by each institution. An institution is whatever was entered in the Project’s institution field.",
				links: [{ label: "Browse all projects", href: "/explore/project" }]
			}}
		>
			<ul className="divide-y divide-base-content/5">
				{institutions.length === 0 && (
					<li className="text-sm text-base-content/60 italic py-2">No institution data yet.</li>
				)}
				{institutions.map((inst, idx) => (
					<li key={inst.name} className="flex items-center justify-between py-1.5 text-sm gap-3">
						<span className="flex items-center gap-2 min-w-0">
							<span className="text-[11px] w-4 text-right text-primary/80 font-semibold tabular-nums">
								{idx + 1}
							</span>
							<span className="truncate text-base-content" title={inst.name}>
								{inst.name}
							</span>
						</span>
						<span className="text-xs font-semibold text-base-content/80 tabular-nums">
							{inst.count}
						</span>
					</li>
				))}
			</ul>
		</DashCard>
	);
}

// ------------------------ Sampling Environments -------------------------
// Per user: switch from env_broad_scale to env_local_scale.
export async function SamplingEnvironmentsCard() {
	const rows = await publicPrisma.sample.groupBy({
		by: ["env_local_scale"],
		where: { env_local_scale: { not: null } },
		_count: { samp_name: true },
		orderBy: { _count: { samp_name: "desc" } },
		take: 5
	});
	const envs = rows
		.filter((r) => r.env_local_scale)
		.map((r) => ({ label: r.env_local_scale as string, count: r._count.samp_name }));

	return (
		<DashCard
			title="Sampling environments"
			subtitle="Top env_local_scale values"
			info={{
				title: "Sampling environments",
				description:
					"Groups public samples by their env_local_scale (ENVO term describing the immediate environment being sampled). The top 5 environments are shown with sample counts.",
				links: [{ label: "Browse samples", href: "/explore/sample" }]
			}}
		>
			<ul className="space-y-2.5 mt-1">
				{envs.length === 0 && (
					<li className="text-sm text-base-content/60 italic py-2">No environment data yet.</li>
				)}
				{envs.map((env, idx) => {
					const max = envs[0].count;
					const widthPct = Math.max(4, Math.round((env.count / max) * 100));
					return (
						<li key={env.label}>
							<div className="flex items-center justify-between text-sm mb-1 gap-3">
								<span className="flex items-center gap-2 min-w-0">
									<span className="text-[11px] w-4 text-right text-primary/80 font-semibold tabular-nums">
										{idx + 1}
									</span>
									<span className="truncate text-base-content capitalize" title={env.label}>
										{env.label}
									</span>
								</span>
								<span className="text-xs font-semibold text-base-content/80 tabular-nums">
									{env.count.toLocaleString()}
								</span>
							</div>
							<div className="h-1.5 rounded-full bg-base-200/70 overflow-hidden">
								<div
									className="h-full rounded-full bg-linear-to-r from-primary/70 to-primary"
									style={{ width: `${widthPct}%` }}
								/>
							</div>
						</li>
					);
				})}
			</ul>
		</DashCard>
	);
}

// --------------------------- Sample Categories ---------------------------
// samp_category is a required field so coverage is 100%. It's a useful
// breakdown of sample type (e.g. sample vs control vs blank).
export async function SampleCategoriesCard() {
	const rows = await publicPrisma.sample.groupBy({
		by: ["samp_category"],
		_count: { samp_name: true },
		orderBy: { _count: { samp_name: "desc" } }
	});
	const totalSamples = rows.reduce((sum, r) => sum + r._count.samp_name, 0);
	const categories = rows.map((r) => ({ label: r.samp_category, count: r._count.samp_name }));

	return (
		<DashCard
			title="Sample categories"
			subtitle="Breakdown of public samples"
			info={{
				title: "Sample categories",
				description:
					"The samp_category field classifies each sample as e.g. a biological sample, a negative control, a positive control, etc. This chart shows how many public samples fall into each category.",
				links: [{ label: "Browse samples", href: "/explore/sample" }]
			}}
		>
			<div className="flex items-baseline justify-between mb-3">
				<span className="text-2xl font-bold text-base-content tabular-nums leading-none">
					{totalSamples.toLocaleString()}
				</span>
				<span className="text-xs text-base-content/55 uppercase tracking-wider font-semibold">
					Public samples
				</span>
			</div>
			<ul className="space-y-2">
				{categories.length === 0 && (
					<li className="text-sm text-base-content/60 italic py-2">No sample data yet.</li>
				)}
				{categories.map((cat) => {
					const pct = totalSamples ? Math.round((cat.count / totalSamples) * 100) : 0;
					return (
						<li key={cat.label}>
							<div className="flex items-center justify-between text-sm mb-1 gap-3">
								<span className="truncate text-base-content capitalize" title={cat.label}>
									{cat.label}
								</span>
								<span className="text-xs text-base-content/70 tabular-nums">
									{cat.count.toLocaleString()}{" "}
									<span className="text-base-content/45">· {pct}%</span>
								</span>
							</div>
							<div className="h-1.5 rounded-full bg-base-200/70 overflow-hidden">
								<div
									className="h-full rounded-full bg-linear-to-r from-secondary/70 to-secondary"
									style={{ width: `${Math.max(2, pct)}%` }}
								/>
							</div>
						</li>
					);
				})}
			</ul>
		</DashCard>
	);
}

// --------------------------- Temporal Coverage ---------------------------
export async function TemporalCoverageCard() {
	const agg = await publicPrisma.sample.aggregate({
		_min: { eventDate: true },
		_max: { eventDate: true },
		_count: { eventDate: true }
	});
	const min = agg._min.eventDate;
	const max = agg._max.eventDate;
	const totalWithDate = agg._count.eventDate;

	const fmt = (d: Date | null) =>
		d
			? new Date(d).toLocaleDateString(undefined, { month: "short", year: "numeric" })
			: "—";

	// Rough span in years, for the headline number.
	let yearsSpan: number | null = null;
	if (min && max) {
		const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
		yearsSpan = Math.max(0, (max.getTime() - min.getTime()) / msPerYear);
	}

	return (
		<DashCard
			title="Temporal coverage"
			subtitle="When samples were collected"
			info={{
				title: "Temporal coverage",
				description:
					"The earliest and latest eventDate across all public samples. Gives you a sense of how far back the ODE record reaches and how recent the newest field collections are.",
				links: [{ label: "Browse samples", href: "/explore/sample" }]
			}}
		>
			<div className="flex items-baseline gap-2 mb-4">
				<span className="text-3xl font-bold text-base-content tabular-nums leading-none">
					{yearsSpan !== null ? yearsSpan.toFixed(1) : "—"}
				</span>
				<span className="text-sm text-base-content/60 font-medium">years of coverage</span>
			</div>

			<div className="relative mb-3">
				<div className="h-1.5 rounded-full bg-base-200/70 overflow-hidden">
					<div className="h-full w-full rounded-full bg-linear-to-r from-primary/50 via-primary to-accent" />
				</div>
				<span className="absolute -top-1 left-0 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-base-100" />
				<span className="absolute -top-1 right-0 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-base-100" />
			</div>
			<div className="flex items-center justify-between text-xs">
				<div>
					<div className="text-[10px] uppercase tracking-wider font-semibold text-base-content/55">
						Earliest
					</div>
					<div className="text-base-content tabular-nums font-semibold">{fmt(min)}</div>
				</div>
				<div className="text-right">
					<div className="text-[10px] uppercase tracking-wider font-semibold text-base-content/55">
						Latest
					</div>
					<div className="text-base-content tabular-nums font-semibold">{fmt(max)}</div>
				</div>
			</div>

			<p className="text-xs text-base-content/55 mt-4">
				Across {totalWithDate.toLocaleString()} samples with recorded dates.
			</p>
		</DashCard>
	);
}

// ---------------------------- Depth Coverage -----------------------------
export async function DepthCoverageCard() {
	const agg = await publicPrisma.sample.aggregate({
		_min: { minimumDepthInMeters: true },
		_max: { maximumDepthInMeters: true },
		_avg: { minimumDepthInMeters: true }
	});
	const min = agg._min.minimumDepthInMeters;
	const max = agg._max.maximumDepthInMeters;
	const avg = agg._avg.minimumDepthInMeters;

	const fmtDepth = (n: number | null) =>
		n === null || n === undefined ? "—" : `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} m`;

	return (
		<DashCard
			title="Depth coverage"
			subtitle="Sampled water column range"
			info={{
				title: "Depth coverage",
				description:
					"Minimum and maximum recorded sampling depth (in meters) across all public samples — plus the average minimum depth so you can see roughly where most sampling happens.",
				links: [{ label: "Browse samples", href: "/explore/sample" }]
			}}
		>
			<div className="grid grid-cols-3 gap-3 mb-4">
				<DepthStat label="Shallowest" value={fmtDepth(min)} />
				<DepthStat label="Avg min" value={fmtDepth(avg)} muted />
				<DepthStat label="Deepest" value={fmtDepth(max)} />
			</div>

			{/*
			 * Simple column-style visual of the water column. Purely decorative
			 * — gives the numbers some visual weight.
			 */}
			<div className="relative h-20 rounded-lg overflow-hidden bg-linear-to-b from-sky-400/20 via-primary/20 to-indigo-900/40">
				<div className="absolute inset-x-0 top-2 text-[10px] uppercase tracking-wider font-semibold text-base-content/55 text-center">
					Surface
				</div>
				<div className="absolute inset-x-0 bottom-2 text-[10px] uppercase tracking-wider font-semibold text-base-content/55 text-center">
					Abyssal
				</div>
			</div>
		</DashCard>
	);
}

function DepthStat({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
	return (
		<div>
			<div className="text-[10px] uppercase tracking-wider font-semibold text-base-content/55 mb-0.5">
				{label}
			</div>
			<div
				className={[
					"tabular-nums font-semibold leading-tight",
					muted ? "text-base sm:text-lg text-base-content/70" : "text-lg sm:text-xl text-base-content"
				].join(" ")}
			>
				{value}
			</div>
		</div>
	);
}

// ------------------------- Metadata Completeness -------------------------
/**
 * Holistic FAIR-ish completeness. We spot-check representative optional
 * fields across each major entity (Project, Sample, Assay, Analysis) and
 * report:
 *   - An overall % score (average across all fields across all entities)
 *   - Per-entity score breakdowns so you can see where gaps are
 *
 * Each field check is a single COUNT query, all fired in parallel.
 */
export async function MetadataCompletenessCard() {
	// Parallel counts: totals + per-field "has value" counts, per entity.
	const [
		totalProjects,
		totalSamples,
		totalAssays,
		totalAnalyses,
		// Project optional metadata
		p_description,
		p_institution,
		p_citation,
		p_license,
		// Sample optional metadata
		s_lat,
		s_long,
		s_envLocal,
		s_depth,
		s_collect,
		// Assay optional metadata
		a_alternate,
		a_subfragment,
		a_reference,
		// Analysis optional metadata
		an_sop,
		an_trim,
		an_clust,
		an_taxCat
	] = await Promise.all([
		publicPrisma.project.count(),
		publicPrisma.sample.count(),
		publicPrisma.assay.count(),
		publicPrisma.analysis.count(),
		publicPrisma.project.count({ where: { projectDescription: { not: null } } }),
		publicPrisma.project.count({ where: { institution: { not: null } } }),
		publicPrisma.project.count({ where: { bibliographicCitation: { not: null } } }),
		publicPrisma.project.count({ where: { license: { not: null } } }),
		publicPrisma.sample.count({ where: { decimalLatitude: { not: null } } }),
		publicPrisma.sample.count({ where: { decimalLongitude: { not: null } } }),
		publicPrisma.sample.count({ where: { env_local_scale: { not: null } } }),
		publicPrisma.sample.count({ where: { minimumDepthInMeters: { not: null } } }),
		publicPrisma.sample.count({ where: { samp_collect_method: { not: null } } }),
		publicPrisma.assay.count({ where: { assay_name_alternate: { not: null } } }),
		publicPrisma.assay.count({ where: { target_subfragment: { not: null } } }),
		publicPrisma.assay.count({ where: { assay_reference: { not: null } } }),
		publicPrisma.analysis.count({ where: { sop_bioinformatics: { not: null } } }),
		publicPrisma.analysis.count({ where: { trim_method: { not: null } } }),
		publicPrisma.analysis.count({ where: { otu_clust_tool: { not: null } } }),
		publicPrisma.analysis.count({ where: { tax_assign_cat: { not: null } } })
	]);

	const rate = (n: number, total: number) => (total === 0 ? 0 : (n / total) * 100);

	// Per-entity scores = mean of its field coverage rates.
	const projectFields = [p_description, p_institution, p_citation, p_license];
	const sampleFields = [s_lat, s_long, s_envLocal, s_depth, s_collect];
	const assayFields = [a_alternate, a_subfragment, a_reference];
	const analysisFields = [an_sop, an_trim, an_clust, an_taxCat];

	const mean = (nums: number[]) =>
		nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;

	const projectScore = Math.round(mean(projectFields.map((n) => rate(n, totalProjects))));
	const sampleScore = Math.round(mean(sampleFields.map((n) => rate(n, totalSamples))));
	const assayScore = Math.round(mean(assayFields.map((n) => rate(n, totalAssays))));
	const analysisScore = Math.round(mean(analysisFields.map((n) => rate(n, totalAnalyses))));

	// Overall = average of the four entity scores (equal weight per entity
	// rather than per row — otherwise Samples would totally dominate the
	// metric because they typically outnumber every other table).
	const overallScore = Math.round(
		mean([projectScore, sampleScore, assayScore, analysisScore])
	);

	const totalFieldsChecked =
		projectFields.length + sampleFields.length + assayFields.length + analysisFields.length;

	return (
		<DashCard
			title="Metadata completeness"
			subtitle={`Across ${totalFieldsChecked} FAIR-ish metadata fields`}
			info={{
				title: "Metadata completeness",
				description:
					"For each entity (projects, samples, assays, analyses) we measure what % of records have a value for a representative set of optional metadata fields. Each entity's score is the average of its per-field rates, and the overall score is the average of the four entity scores — so one huge table doesn't drown out the others.",
				links: [
					{ label: "What is FAIR data?", href: "/learn" },
					{ label: "Browse projects", href: "/explore/project" },
					{ label: "Browse samples", href: "/explore/sample" }
				]
			}}
		>
			<div className="flex flex-col sm:flex-row items-center gap-5">
				<RadialGauge value={overallScore} size="lg" />
				<div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
					<CoverageRow label="Projects" value={projectScore} total={totalProjects} />
					<CoverageRow label="Samples" value={sampleScore} total={totalSamples} />
					<CoverageRow label="Assays" value={assayScore} total={totalAssays} />
					<CoverageRow label="Analyses" value={analysisScore} total={totalAnalyses} />
				</div>
			</div>
			<div className="text-[11px] text-base-content/55 mt-4 leading-relaxed">
				Higher is better. Equal weight per entity — not per row — so tables with many rows
				don&apos;t drown out tables with fewer rows.
			</div>
		</DashCard>
	);
}

// --------------------------- Shared primitives ---------------------------
function RadialGauge({ value, size = "md" }: { value: number; size?: "md" | "lg" }) {
	const dim = size === "lg" ? 112 : 92;
	const stroke = size === "lg" ? 12 : 10;
	const radius = (dim - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const dash = (value / 100) * circumference;

	return (
		<div className="relative shrink-0" style={{ width: dim, height: dim }}>
			<svg viewBox={`0 0 ${dim} ${dim}`} className="w-full h-full -rotate-90" aria-hidden="true">
				<circle
					cx={dim / 2}
					cy={dim / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={stroke}
					className="text-base-200/80"
				/>
				<circle
					cx={dim / 2}
					cy={dim / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={`${dash} ${circumference - dash}`}
					className="text-primary"
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="text-center">
					<div
						className={[
							"font-bold text-base-content leading-none tabular-nums",
							size === "lg" ? "text-2xl" : "text-xl"
						].join(" ")}
					>
						{value}%
					</div>
					<div className="text-[10px] uppercase tracking-wider text-base-content/55 mt-0.5">
						Score
					</div>
				</div>
			</div>
		</div>
	);
}

function CoverageRow({ label, value, total }: { label: string; value: number; total?: number }) {
	return (
		<div>
			<div className="flex items-center justify-between text-xs">
				<span className="text-base-content/80 font-medium">
					{label}
					{typeof total === "number" && (
						<span className="text-base-content/45 font-normal">
							{" "}
							· {total.toLocaleString()}
						</span>
					)}
				</span>
				<span className="font-semibold text-base-content tabular-nums">{value}%</span>
			</div>
			<div className="h-1.5 mt-1 rounded-full bg-base-200/70 overflow-hidden">
				<div
					className="h-full rounded-full bg-linear-to-r from-primary/70 to-primary"
					style={{ width: `${value}%` }}
				/>
			</div>
		</div>
	);
}

// ------------------------------ Skeletons --------------------------------
export function WidgetCardSkeleton({ className = "h-60" }: { className?: string }) {
	return <div className={["skeleton rounded-2xl", className].join(" ")} aria-hidden="true" />;
}
