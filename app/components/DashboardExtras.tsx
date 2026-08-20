import Link from "next/link";
import { trustedPrisma } from "@/app/helpers/prisma";
import DashCard from "./dataSummary/DashCard";
import DoughnutChart from "./charts/DoughnutChart";
import { EARLIEST_VALID_SAMPLE_DATE } from "./dataSummary/TemporalCoverageCard";
import { Prisma } from "../generated/prisma/client";

/**
 * ---------------------------------------------------------------------------
 * Individual, real-data dashboard widgets for the Data Summary.
 * ---------------------------------------------------------------------------
 * Each widget is its own async server component so the page can arrange them
 * newspaper-style — alongside the map, under Target Genes, in their own
 * rows, etc. — without one giant "widget row" dictating the layout.
 *
 * A few cross-cutting notes:
 *   - Some fields use -9999 as a "not applicable" sentinel. For dates this
 *     can surface as a very-early DateTime (e.g. year <1900) or — more
 *     subtly — as a Unix-epoch ghost (≈1969-12-31). For depths it surfaces
 *     as a large negative number. Every widget that aggregates these
 *     fields filters sentinels out BEFORE the min/max/avg is taken so the
 *     dashboard never shows "9999 BCE" or "-9999 m".
 *   - Each card uses the shared DashCard shell so they all read as part of
 *     the same dashboard family.
 * ---------------------------------------------------------------------------
 */

// Backward-compat alias: older compiled chunks referenced EARLIEST_VALID_DATE.
const EARLIEST_VALID_DATE = EARLIEST_VALID_SAMPLE_DATE;

type RichnessEntityConfig = {
	label: string;
	modelName: "Project" | "Sample" | "Assay" | "Analysis";
	delegate: "project" | "sample" | "assay" | "analysis";
	href: string;
};

const METADATA_RICHNESS_ENTITIES: RichnessEntityConfig[] = [
	{ label: "Projects", modelName: "Project", delegate: "project", href: "/explore/project" },
	{ label: "Samples", modelName: "Sample", delegate: "sample", href: "/explore/sample" },
	{ label: "Assays", modelName: "Assay", delegate: "assay", href: "/explore/assay" },
	{ label: "Analyses", modelName: "Analysis", delegate: "analysis", href: "/explore/analysis" }
];

function getOptionalScalarFieldNames(modelName: RichnessEntityConfig["modelName"]): string[] {
	const runtimeDataModel = (
		trustedPrisma as unknown as {
			_runtimeDataModel?: {
				models?: Record<string, { fields?: { name: string; kind: string; isRequired: boolean; isList: boolean }[] }>;
			};
		}
	)._runtimeDataModel;

	const model = runtimeDataModel?.models?.[modelName];
	if (!model?.fields) return [];

	// Include every optional scalar metadata column (no hard-coded field list).
	return model.fields
		.filter((field) => field.kind === "scalar" && !field.isRequired && !field.isList)
		.map((field) => field.name);
}

// ============================ Data Contributors ============================
/**
 * Renamed from "Top institutions". Same data (group projects by
 * the institution field), but presented as the data contributors of the
 * platform. Long institution names are allowed to wrap across multiple
 * lines instead of truncating, since these are a small, high-value list.
 */
export async function TopInstitutionsCard() {
	const rows = await trustedPrisma.project.groupBy({
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
			title="Data Contributors"
			titleClassName="text-base-content/75"
			padding="md"
			info={{
				title: "Data Contributors",
				description:
					"Lists data submitters based on each project's `institution` field. Each row is one submitted institution value.",
				links: [{ label: "Browse all projects", href: "/explore/project" }]
			}}
		>
			<ul className="divide-y divide-base-content/5">
				{institutions.length === 0 && (
					<li className="text-sm text-base-content/60 italic py-2">No institution data yet.</li>
				)}
				{institutions.map((inst, idx) => (
					<li key={inst.name} className="flex items-start py-2 text-sm gap-3">
						<span className="flex items-start gap-2 min-w-0 w-full">
							<span className="text-[11px] mt-0.5 w-4 text-right text-primary/80 font-semibold tabular-nums shrink-0">
								{idx + 1}
							</span>
							{/* Allow the name to wrap to multiple lines instead of
							    truncating — institutions can have very long names. */}
							<span className="text-base-content leading-snug wrap-break-word" title={inst.name}>
								{inst.name}
							</span>
						</span>
					</li>
				))}
			</ul>
		</DashCard>
	);
}

// ========================= Sampling Environments ===========================
/**
 * Donut chart of env_local_scale values across all samples. Reuses
 * the shared DoughnutChart so the visual language matches Target Genes
 * and the previous Sample Categories donut. We pull the top N values and
 * stuff the long tail into a single "Other" slice so the legend doesn't
 * blow out at hundreds of ENVO terms.
 */
const ENV_SCALE_TOP_N = 8;
export async function SamplingEnvironmentsCard() {
	const rows = await trustedPrisma.sample.groupBy({
		by: ["env_local_scale"],
		where: { env_local_scale: { not: null } },
		_count: { samp_name: true },
		orderBy: { _count: { samp_name: "desc" } }
	});
	const all = rows
		.filter((r) => r.env_local_scale)
		.map((r) => ({ label: r.env_local_scale as string, count: r._count.samp_name }));

	const top = all.slice(0, ENV_SCALE_TOP_N);
	const tail = all.slice(ENV_SCALE_TOP_N);
	const tailSum = tail.reduce((sum, t) => sum + t.count, 0);
	const slices = tailSum > 0 ? [...top, { label: `Other (${tail.length})`, count: tailSum }] : top;

	return (
		<DashCard
			title="Sampling Environments"
			titleClassName="text-base-content/75"
			info={{
				title: "env_local_scale",
				description:
					"Distribution of samples grouped by env_local_scale (ENVO local environment). Long tail is collapsed into “Other”.",
				links: [{ label: "Browse samples", href: "/explore/sample" }]
			}}
		>
			{slices.length === 0 ? (
				<div className="text-sm text-base-content/60 italic py-2">No environment data yet.</div>
			) : (
				<DoughnutChart labels={slices.map((s) => s.label)} data={slices.map((s) => s.count)} compact />
			)}
		</DashCard>
	);
}

// ========================== Temporal Coverage ==============================
// Moved to ./dataSummary/TemporalCoverageCard.tsx so it can be reused on
// the project detail page. Re-export here to keep this module the single
// import site for dashboard widgets.
export { TemporalCoverageCard, TemporalCoverageCardSkeleton } from "./dataSummary/TemporalCoverageCard";

// ======================== Samples Collected Over Time ======================
/**
 * Line chart of sample collection volume over time (bucketed by year).
 *
 * Why eventDate and not dateSubmitted?
 *   eventDate is the date the sample was actually collected in the field.
 *   It reaches back decades, produces a richer curve, and matches the
 *   ODE record's scientific framing. Sample doesn't have dateSubmitted of
 *   its own anyway — that's on Project.
 *
 * Why raw SQL?
 *   Prisma doesn't natively support "group by date_trunc". The alternatives
 *   are (a) findMany all eventDates and bucket in JS, which doesn't scale,
 *   or (b) 100 parallel count() queries per-year, which is wasteful. A single
 *   GROUP BY date_trunc('year', ...) is both cheapest and simplest.
 */
export async function SamplesOverTimeCard({ trusted }: { trusted: boolean }) {
	type Row = { bucket: Date; count: bigint };
	// 1990-01-01 floor: matches the EARLIEST_VALID_SAMPLE_DATE used by the
	// Temporal Coverage card. This excludes both the -9999 sentinel and
	// Unix-epoch ghost rows around 1969-12-31 / 1970-01-01 that previously
	// pulled the chart's left edge way back and squashed everything.
	const trustedFilter = trusted
		? Prisma.sql`
			AND EXISTS (
				SELECT 1
				FROM "Library" l
				JOIN "Occurrence" o USING("lib_id")
				JOIN "Analysis" a USING("analysis_run_name")
				WHERE l."samp_name" = s."samp_name"
					AND a."trusted" = true
			)
		`
		: Prisma.empty;

	const rows = await trustedPrisma.$queryRaw<Row[]>`
		SELECT
			date_trunc('year', s."eventDate") AS bucket,
			COUNT(*)::bigint AS count
		FROM "Sample" s
		JOIN "Project" p USING("project_id")
		WHERE s."eventDate" >= ${EARLIEST_VALID_DATE}
		${trustedFilter}
		GROUP BY bucket
		ORDER BY bucket ASC
	`;

	const points = rows.map((r) => ({
		year: r.bucket.getUTCFullYear(),
		count: Number(r.count)
	}));

	return (
		<DashCard
			title="Samples Collected Over Time"
			titleClassName="text-base-content/75"
			subtitle="Yearly sample collection volume"
			info={{
				title: "Samples Collected Over Time",
				description:
					"Count of samples grouped by the year they were collected (eventDate). Samples with placeholder dates are excluded.",
				links: [{ label: "Browse samples", href: "/explore/sample" }]
			}}
		>
			<SamplesOverTimeChart points={points} />
		</DashCard>
	);
}

/**
 * Simple server-rendered SVG line chart with a labeled Y axis and a faded
 * area beneath the line. Intentionally lightweight — no Chart.js client
 * boundary, no interactivity — the point is a "glanceable" graph that
 * matches the calm-dashboard aesthetic.
 *
 * Why no "Year" X-axis title: the tick values are 4-digit years, which
 * are self-explanatory. Adding the word "Year" only made it crowd the
 * tick labels at the bottom of the SVG.
 */
function SamplesOverTimeChart({ points }: { points: { year: number; count: number }[] }) {
	if (points.length === 0) {
		return (
			<div className="h-56 flex items-center justify-center text-sm text-base-content/60 italic">
				No sample data yet.
			</div>
		);
	}

	// Chart layout (kept in a single place so the axis labels and the path
	// stay consistent). Bottom padding only needs to cover the year tick
	// labels now that we removed the "Year" axis title.
	const width = 640;
	const height = 220;
	const padding = { top: 12, right: 12, bottom: 22, left: 44 };

	const innerW = width - padding.left - padding.right;
	const innerH = height - padding.top - padding.bottom;

	const minYear = points[0]!.year;
	const maxYear = points[points.length - 1]!.year;
	const yearRange = Math.max(1, maxYear - minYear);

	const maxCount = Math.max(1, ...points.map((p) => p.count));

	const x = (year: number) => padding.left + ((year - minYear) / yearRange) * innerW;
	const y = (count: number) => padding.top + innerH - (count / maxCount) * innerH;

	const linePath = points
		.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year).toFixed(2)},${y(p.count).toFixed(2)}`)
		.join(" ");

	const areaPath = [
		`M${x(minYear).toFixed(2)},${(padding.top + innerH).toFixed(2)}`,
		...points.map((p) => `L${x(p.year).toFixed(2)},${y(p.count).toFixed(2)}`),
		`L${x(maxYear).toFixed(2)},${(padding.top + innerH).toFixed(2)}`,
		"Z"
	].join(" ");

	// Pick ~5 evenly-spaced x-axis ticks (years).
	const xTickCount = Math.min(5, points.length);
	const xTicks: number[] = [];
	for (let i = 0; i < xTickCount; i++) {
		const t = xTickCount === 1 ? 0 : i / (xTickCount - 1);
		xTicks.push(Math.round(minYear + t * yearRange));
	}

	// 4 y-axis ticks: 0, 1/3, 2/3, max.
	const yTickValues = [0, Math.round(maxCount / 3), Math.round((maxCount / 3) * 2), maxCount];

	const gradientId = "samples-over-time-area";

	return (
		<div className="w-full">
			<svg
				viewBox={`0 0 ${width} ${height}`}
				className="w-full h-56"
				role="img"
				aria-label="Samples collected per year"
			>
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.55" />
						<stop offset="55%" stopColor="var(--color-primary)" stopOpacity="0.18" />
						<stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
					</linearGradient>
				</defs>

				{/* Gridlines — lightweight, just under the line */}
				{yTickValues.map((v) => (
					<line
						key={`grid-${v}`}
						x1={padding.left}
						x2={padding.left + innerW}
						y1={y(v)}
						y2={y(v)}
						stroke="currentColor"
						className="text-base-content/10"
						strokeWidth="1"
					/>
				))}

				{/* Fade area under the line */}
				<path d={areaPath} fill={`url(#${gradientId})`} className="text-primary" />

				{/* The line itself */}
				<path
					d={linePath}
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-primary"
				/>

				{/* X-axis baseline */}
				<line
					x1={padding.left}
					x2={padding.left + innerW}
					y1={padding.top + innerH}
					y2={padding.top + innerH}
					stroke="currentColor"
					className="text-base-content/30"
					strokeWidth="1"
				/>
				{/* Y-axis baseline */}
				<line
					x1={padding.left}
					x2={padding.left}
					y1={padding.top}
					y2={padding.top + innerH}
					stroke="currentColor"
					className="text-base-content/30"
					strokeWidth="1"
				/>

				{/* Y-axis tick labels (count) */}
				{yTickValues.map((v) => (
					<text
						key={`ytick-${v}`}
						x={padding.left - 6}
						y={y(v)}
						textAnchor="end"
						dominantBaseline="middle"
						className="fill-base-content/70 text-[10px] tabular-nums"
					>
						{v.toLocaleString()}
					</text>
				))}

				{/* X-axis tick labels (year). dominantBaseline=hanging so the
				    label sits below the axis line cleanly without overlapping. */}
				{xTicks.map((year) => (
					<text
						key={`xtick-${year}`}
						x={x(year)}
						y={padding.top + innerH + 6}
						textAnchor="middle"
						dominantBaseline="hanging"
						className="fill-base-content/70 text-[10px] tabular-nums"
					>
						{year}
					</text>
				))}

				{/* Axis title: Y. (We deliberately don't render an "X" axis
				    title — the tick values are 4-digit years and don't need
				    "Year" repeated underneath them.) */}
				<text
					transform={`translate(12, ${padding.top + innerH / 2}) rotate(-90)`}
					textAnchor="middle"
					className="fill-base-content/70 text-[10px] uppercase tracking-wider font-semibold"
				>
					Samples
				</text>
			</svg>
		</div>
	);
}

// =========================== Sample Categories =============================
// Removed (was a donut of samp_category — biological vs control samples).
// We replaced it with the env_local_scale donut above, which is more
// informative; biological-vs-control was dominated by one category and
// didn't pull its weight on the dashboard.

// =========================== Table Counts ==================================
/**
 * "Explore the data — by the numbers." Inspired by the OOI in-Numbers
 * infographic style: punchy abbreviated numbers (1.2K, 3.4M, etc.), each
 * one a tile that links into its explore page. Tiles are stacked in a
 * 2-column grid so the card stays narrow on the dashboard.
 *
 * Why an abbreviated number format and not raw .toLocaleString():
 *   The purpose of this card is "scale at a glance". Raw ints like 601,865
 *   read fine on a wide column, but at the narrower size the user wants
 *   they wrap awkwardly and stop being scannable. K/M/B abbreviations
 *   keep each tile to a single visually-loud token, with the exact count
 *   available in the tile's tooltip.
 */
export async function TableCountsCard() {
	const [projects, samples, assays, assayPreps, libraries, analyses, occurrences, features, taxa, assignments] =
		await trustedPrisma.$transaction([
			trustedPrisma.project.count(),
			trustedPrisma.sample.count(),
			trustedPrisma.assay.count(),
			trustedPrisma.assayPrep.count(),
			trustedPrisma.library.count(),
			trustedPrisma.analysis.count(),
			trustedPrisma.occurrence.count(),
			trustedPrisma.feature.count(),
			trustedPrisma.taxonomy.count(),
			trustedPrisma.assignment.count()
		]);

	const tables: { label: string; count: number; href: string }[] = [
		{ label: "Projects", count: projects, href: "/explore/project" },
		{ label: "Samples", count: samples, href: "/explore/sample" },
		{ label: "Assays", count: assays, href: "/explore/assay" },
		{ label: "Assay preps", count: assayPreps, href: "/explore/assayPrep" },
		{ label: "Libraries", count: libraries, href: "/explore/library" },
		{ label: "Analyses", count: analyses, href: "/explore/analysis" },
		{ label: "Occurrences", count: occurrences, href: "/explore/occurrence" },
		{ label: "Features", count: features, href: "/explore/feature" },
		{ label: "Taxa", count: taxa, href: "/explore/taxonomy" },
		{ label: "Assignments", count: assignments, href: "/explore/assignment" }
	];

	return (
		<DashCard
			title="Explore the data"
			titleClassName="text-base-content/75"
			className="h-88"
			bodyClassName="h-full flex flex-col"
			info={{
				title: "Explore the data",
				description:
					"Live row counts for every table in ODE, abbreviated for quick scanning. Click any tile to open that table's explore page.",
				links: [{ label: "Explore hub", href: "/explore" }]
			}}
		>
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 flex-1 min-h-0">
				{tables.map((t) => (
					<BigCountTile key={t.label} label={t.label} count={t.count} href={t.href} />
				))}
			</div>
		</DashCard>
	);
}

/**
 * Single "by the numbers" tile. The BIG abbreviated number is the hero;
 * the label sits underneath in small caps. Whole tile is the link.
 */
function BigCountTile({ label, count, href }: { label: string; count: number; href: string }) {
	const exact = count.toLocaleString();
	return (
		<Link
			href={href}
			title={`${exact} ${label.toLowerCase()}`}
			className="group flex flex-col gap-0.5 px-3 py-3 rounded-xl bg-base-300/40 hover:bg-base-300/70 transition-colors"
		>
			<span className="text-2xl sm:text-3xl font-extrabold text-base-content leading-none tabular-nums tracking-tight group-hover:text-primary transition-colors">
				{formatPunchy(count)}
			</span>
			<span className="text-[10px] uppercase tracking-wider font-semibold text-base-content/70 leading-snug">
				{label}
			</span>
		</Link>
	);
}

/**
 * 1.2K / 3.4M / 1.7B style abbreviation. We keep one decimal of precision
 * for readability without going past 4 visible characters.
 */
function formatPunchy(n: number): string {
	if (n < 1000) return n.toString();
	if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
	if (n < 1_000_000) return `${Math.round(n / 1000)}K`;
	if (n < 10_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
	if (n < 1_000_000_000) return `${Math.round(n / 1_000_000)}M`;
	return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
}

// ======================== Metadata Completeness ============================
/**
 * "Beyond the minimum" — shows, for each entity, what percentage of that
 * entity's OPTIONAL metadata fields are populated on average across all
 * records. Required fields are always 100% by definition, so they're
 * excluded — the point is to highlight how much *extra* information
 * submitters choose to include.
 *
 * Math:
 *   For each entity:
 *     - Discover all optional scalar fields from the Prisma schema.
 *     - For each field, count how many records have a non-null value.
 *     - The entity's score = mean(fieldFillRate) across those fields.
 *
 * Layout: tall card with one radial gauge per entity stacked vertically.
 */
export async function MetadataCompletenessCard() {
	const rate = (n: number, total: number) => (total === 0 ? 0 : (n / total) * 100);
	const mean = (nums: number[]) => (nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length);

	//TODO: rework to not use promise.all
	const entities = await Promise.all(
		METADATA_RICHNESS_ENTITIES.map(async (entity) => {
			const delegate = (trustedPrisma as unknown as Record<string, { count: (args?: unknown) => Promise<number> }>)[
				entity.delegate
			];

			const optionalFields = getOptionalScalarFieldNames(entity.modelName);
			const total = await delegate!.count();
			const populatedCounts = await Promise.all(
				optionalFields.map((field) =>
					delegate!.count({
						where: { [field]: { not: null } }
					})
				)
			);

			return {
				label: entity.label,
				score: Math.round(mean(populatedCounts.map((n) => rate(n, total)))),
				total,
				fieldCount: optionalFields.length,
				href: entity.href
			};
		})
	);

	return (
		<DashCard
			title="Metadata richness"
			titleClassName="text-base-content/75"
			subtitle="Percent of optional fields recorded"
			padding="md"
			info={{
				title: "Metadata richness",
				description:
					"How much extra (non-required) metadata submitters choose to include. For each entity we track all optional scalar fields from the schema and score by the mean fill rate across those fields. Required fields aren't included — they're always 100% and don't tell us anything about submitter effort.",
				links: [
					{ label: "What is FAIR data?", href: "/learn" },
					{ label: "Browse projects", href: "/explore/project" },
					{ label: "Browse samples", href: "/explore/sample" }
				]
			}}
		>
			<ul className="flex flex-col gap-5">
				{entities.map((e) => (
					<li key={e.label}>
						<Link
							href={e.href}
							className="flex items-center gap-4 p-2 -mx-2 rounded-lg hover:bg-base-300/50 transition-colors group"
						>
							<RadialGauge value={e.score} size="sm" />
							<div className="flex-1 min-w-0">
								<div className="flex items-baseline justify-between gap-2">
									<span className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors truncate">
										{e.label}
									</span>
									<span className="text-[10px] uppercase tracking-wider text-base-content/70 tabular-nums shrink-0">
										{e.total.toLocaleString()} records
									</span>
								</div>
								<div className="text-[11px] text-base-content/70 mt-0.5">{e.fieldCount} optional fields tracked</div>
							</div>
						</Link>
					</li>
				))}
			</ul>
			<p className="text-[11px] text-base-content/70 mt-5 leading-relaxed">
				Higher scores mean submitters went beyond the minimum and filled in richer, more reusable metadata.
			</p>
		</DashCard>
	);
}

// ============================ Shared primitives ============================
/**
 * Donut-style radial gauge. The stroke is drawn as a fraction of the
 * circumference via `strokeDasharray`, which is the standard trick for
 * SVG progress circles. The `-rotate-90` on the SVG means the stroke
 * starts at the 12-o'clock position (otherwise SVG starts at 3-o'clock).
 */
function RadialGauge({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
	const dim = size === "lg" ? 112 : size === "sm" ? 60 : 92;
	const stroke = size === "lg" ? 12 : size === "sm" ? 8 : 10;
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
					className="text-base-300/80"
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
				<div
					className={[
						"font-bold text-base-content leading-none tabular-nums",
						size === "lg" ? "text-2xl" : size === "sm" ? "text-xs" : "text-xl"
					].join(" ")}
				>
					{value}%
				</div>
			</div>
		</div>
	);
}

// ================================ Skeletons ================================
export function WidgetCardSkeleton({ className = "h-60" }: { className?: string }) {
	return <div className={["skeleton rounded-2xl", className].join(" ")} aria-hidden="true" />;
}
