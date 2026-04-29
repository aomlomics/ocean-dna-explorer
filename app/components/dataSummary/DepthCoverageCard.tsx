import { publicPrisma } from "@/app/helpers/prisma";
import DashCard from "@/app/components/dataSummary/DashCard";
import ThemeAwareSvg from "@/app/components/help/ThemeAwareSvg";

type DepthCoverageCardProps = {
	/**
	 * Optional project scope. When supplied, the card aggregates only that
	 * project's samples — used on the project detail page where the card
	 * stands in for / sits under the project cover image.
	 */
	projectId?: string;
};

type DepthStats = {
	min: number | null;
	avg: number | null;
	max: number | null;
};

export async function DepthCoverageCard({ projectId }: DepthCoverageCardProps) {
	const whereBase = projectId ? { project_id: projectId } : {};

	// -9999 is the project sentinel for "not applicable". Filtering depths
	// to >= 0 strips both that sentinel and any other negative noise.
	const [minAgg, maxAgg, avgAgg] = await Promise.all([
		publicPrisma.sample.aggregate({
			where: { ...whereBase, minimumDepthInMeters: { gte: 0 } },
			_min: { minimumDepthInMeters: true }
		}),
		publicPrisma.sample.aggregate({
			where: { ...whereBase, maximumDepthInMeters: { gte: 0 } },
			_max: { maximumDepthInMeters: true }
		}),
		publicPrisma.sample.aggregate({
			where: { ...whereBase, minimumDepthInMeters: { gte: 0 } },
			_avg: { minimumDepthInMeters: true }
		})
	]);

	const stats: DepthStats = {
		min: minAgg._min.minimumDepthInMeters,
		avg: avgAgg._avg.minimumDepthInMeters,
		max: maxAgg._max.maximumDepthInMeters
	};

	return (
		<DashCard
			title="Depth coverage"
			titleClassName="text-base-content/75"
			className="h-88"
			bodyClassName="relative p-0"
			headerClassName="relative z-10 bg-base-200 pb-4"
			padding="none"
			info={{
				description:
					"The shallowest sampling depth (minimumDepthInMeters), average minimumDepthInMeters, and the deepest maximumDepthInMeters across all samples.",
				links: [
					{
						label: projectId ? "Browse this project's samples" : "Browse samples",
						href: projectId ? `/explore/project/${projectId}` : "/explore/sample"
					}
				]
			}}
		>
			<DepthProfile stats={stats} />
		</DashCard>
	);
}

/**
 * Art-first depth visualization.
 *
 * The whole card body IS the picture: a single SVG with a steep
 * continental-shelf drop on the left, a long abyss across the bottom,
 * and a small seamount tucked into the bottom-right corner. There are
 * no axis labels, no gridlines, no leader-lines from labels to floor —
 * those felt graph-y. Instead, the three depth numbers float in the
 * open water at their vertically-correct positions and become the
 * card's content.
 */
function DepthProfile({ stats }: { stats: DepthStats }) {
	const allMissing = stats.min === null && stats.avg === null && stats.max === null;
	if (allMissing) {
		return (
			<div className="h-88 flex items-center justify-center text-sm text-base-content/60 italic">
				No valid depth data yet.
			</div>
		);
	}

	const W = 720;
	const H = 520;

	// Single-line labels: big number + smaller "m minimum/maximum/avg minimum".
	// We treat the computed Y as the typographic baseline of the label.
	const GROUP_GAP = 14;
	const STEP = 56 + GROUP_GAP;
	// When min and avg-min are *close in depth*, we intentionally stack them
	// tightly so the visual spacing doesn't imply a large depth gap.
	const CLOSE_DEPTH_M = 600;
	const CLOSE_STACK_STEP = 44;

	// Depth scale runs linearly from the surface reference all the way down.
	// (We intentionally extend the surface/tick band past the visible edges
	// so strokes never look clipped by the card rounding.)
	const surfaceY = 84;
	// Keep surface fixed; allow a bit more room so shallow labels don't get
	// pushed down into deeper tick bands.
	const scaleBottom = H - 18;
	// Label anchors are clamped inside the same depth band.
	// Only keep labels just under the surface line — don't force them down
	// or shallow values (e.g. 307m) will look much deeper than they are.
	//
	// Special-case the minimum: it should sit as close to the surface line
	// as possible (but still below it) when the data is extremely shallow.
	const minTop = surfaceY + 6;
	const labelTop = surfaceY + 10;
	const labelBottom = scaleBottom - 8;
	const labelX = 326;
	const ticksLabelX = 710;

	const ref = Math.max(1, stats.max ?? stats.avg ?? stats.min ?? 1);
	const tickStep = 1000;
	// Give the scale one extra tick below the deepest point so labels/ticks
	// breathe and the bottom isn't "hard-clipped" at the max.
	const axisMax = Math.max(tickStep, Math.ceil((ref + tickStep) / tickStep) * tickStep);
	const depthToScaleY = (d: number) => {
		const t = Math.max(0, Math.min(1, d / axisMax));
		return surfaceY + t * (scaleBottom - surfaceY);
	};

	// Raw anchor positions (label baseline). Null when stat is absent.
	let minA = stats.min !== null ? depthToScaleY(stats.min) : null;
	let avgA = stats.avg !== null ? depthToScaleY(stats.avg) : null;
	let maxA = stats.max !== null ? depthToScaleY(stats.max) : null;

	// Keep every label below the surface line and inside the drawable band.
	const clampY = (y: number, top: number) => Math.max(top, Math.min(labelBottom, y));
	if (minA !== null) minA = clampY(minA, minTop);
	if (avgA !== null) avgA = clampY(avgA, labelTop);
	if (maxA !== null) maxA = clampY(maxA, labelTop);

	// Push each group down if it collides with the one above it.
	// If avg would overlap min, put it as close to min as possible.
	if (
		minA !== null &&
		avgA !== null &&
		stats.min !== null &&
		stats.avg !== null &&
		stats.avg - stats.min <= CLOSE_DEPTH_M
	) {
		avgA = minA + CLOSE_STACK_STEP;
	} else if (minA !== null && avgA !== null && avgA - minA < STEP) {
		avgA = minA + STEP;
	}
	if (avgA !== null && maxA !== null && maxA - avgA < STEP) maxA = avgA + STEP;
	// If only min and max (no avg), check those too.
	if (avgA === null && minA !== null && maxA !== null && maxA - minA < STEP) maxA = minA + STEP;
	// Clamp to bottom so nothing falls off.
	if (maxA !== null) maxA = Math.min(maxA, labelBottom);
	if (avgA !== null) avgA = Math.min(avgA, labelBottom);
	if (minA !== null) minA = Math.min(minA, labelBottom);

	const tickDepths = Array.from({ length: Math.floor(axisMax / tickStep) + 1 }, (_, i) => i * tickStep);

	return (
		<div className="relative w-full h-full">
			<ThemeAwareSvg
				lightSrc="/images/depth_cov_data_card_light.svg"
				darkSrc="/images/depth_cov_data_card_dark.svg"
				alt="Ocean depth profile background"
				fill
				sizes="(max-width: 1024px) 100vw, 50vw"
				priority={false}
				className="object-cover"
			/>

			<svg
				viewBox={`0 0 ${W} ${H}`}
				className="absolute inset-0 w-full h-full block"
				role="img"
				aria-label="Depth coverage profile"
			>
				{/* Surface label (no line). */}
				<text
					x={ticksLabelX}
					y={surfaceY + 2}
					textAnchor="end"
					className="fill-base-content/55 text-[16px] uppercase tracking-[0.2em] font-semibold"
				>
					Surface
				</text>

				{/* Depth scale ticks every 1000 m on the right edge */}
				{tickDepths.map((d) => {
					if (d === 0) return null;
					const y = depthToScaleY(d);
					return (
						<g key={d}>
							<line
								x1={ticksLabelX - 26}
								y1={y}
								x2={ticksLabelX - 4}
								y2={y}
								stroke="currentColor"
								className="text-base-content/25"
								strokeWidth={1}
							/>
							<text
								x={ticksLabelX}
								y={y}
								dominantBaseline="middle"
								textAnchor="end"
								className="fill-base-content/50 text-[17px] font-semibold tabular-nums"
							>
								{d.toLocaleString()}
							</text>
						</g>
					);
				})}

				{/* All three labels are one line: big number + small descriptor. */}
				{minA !== null && stats.min !== null && (
					<g transform={`translate(${labelX}, ${minA})`}>
						<text
							y={0}
							dominantBaseline="alphabetic"
							className="fill-base-content/90 text-[34px] font-semibold tracking-tight"
						>
							<tspan className="font-bold tabular-nums text-[42px]">{formatDepthValue(stats.min)}</tspan>
							<tspan className="fill-base-content/90 text-[28px]"> m</tspan>
							<tspan dx="8" className="fill-base-content/80 text-[20px] font-semibold">
								minimum
							</tspan>
						</text>
					</g>
				)}

				{avgA !== null && stats.avg !== null && (
					<g transform={`translate(${labelX}, ${avgA})`}>
						<text
							y={0}
							dominantBaseline="alphabetic"
							className="fill-base-content/90 text-[34px] font-semibold tracking-tight"
						>
							<tspan className="font-bold tabular-nums text-[46px]">{formatDepthValue(stats.avg)}</tspan>
							<tspan className="fill-base-content/90 text-[28px]"> m</tspan>
							<tspan dx="8" className="fill-base-content/80 text-[20px] font-semibold">
								avg minimum
							</tspan>
						</text>
					</g>
				)}

				{maxA !== null && stats.max !== null && (
					<g transform={`translate(${labelX}, ${maxA})`}>
						<text
							y={0}
							dominantBaseline="alphabetic"
							className="fill-base-content/90 text-[34px] font-semibold tracking-tight"
						>
							<tspan className="font-bold tabular-nums text-[42px]">{formatDepthValue(stats.max)}</tspan>
							<tspan className="fill-base-content/90 text-[28px]"> m</tspan>
							<tspan dx="8" className="fill-base-content/80 text-[20px] font-semibold">
								maximum
							</tspan>
						</text>
					</g>
				)}
			</svg>
		</div>
	);
}

function formatDepthValue(n: number) {
	return Math.round(n).toLocaleString();
}

export function DepthCoverageCardSkeleton() {
	return <div className="skeleton rounded-2xl h-88" aria-hidden="true" />;
}
