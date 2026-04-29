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
			className="h-64"
			bodyClassName="relative p-0"
			headerClassName="relative z-10 bg-base-200"
			padding="none"
			info={{
				title: "Depth coverage",
				description:
					"Shallowest, average minimum, and deepest valid sample depths. Sentinel values like -9999 are excluded.",
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
			<div className="h-72 sm:h-80 flex items-center justify-center text-sm text-base-content/60 italic">
				No valid depth data yet.
			</div>
		);
	}

	// Internal viewBox dimensions — both the background SVG and the overlay
	// annotations share this coordinate system.
	const W = 720;
	const H = 420;

	// Vertical band the depth labels can occupy. Top reserves room for the
	// "Surface" reference; bottom keeps labels off the abyss floor / mound.
	const labelTop = 108;
	const labelBottom = H - 78;
	// Labels live to the right of the steep shelf so they never collide
	// with the silhouette.
	const labelX = 326;
	const ticksLabelX = 710;
	const surfaceY = 94;

	// Scale each depth proportionally to a rounded "axis max" so tick
	// labels don't collapse at the bottom (e.g. 6000 and 7000).
	const ref = Math.max(1, stats.max ?? stats.avg ?? stats.min ?? 1);
	const tickStep = 1000;
	const axisMax = Math.max(tickStep, Math.ceil(ref / tickStep) * tickStep);
	const depthToY = (d: number) => {
		const t = Math.max(0, Math.min(1, d / axisMax));
		return labelTop + t * (labelBottom - labelTop);
	};

	const minYRaw = stats.min !== null ? depthToY(stats.min) : null;
	const avgYRaw = stats.avg !== null ? depthToY(stats.avg) : null;
	const maxY = stats.max !== null ? depthToY(stats.max) : null;

	// When the project's min and avg-min are nearly identical (very-shallow
	// data) their labels would overlap. Spread them symmetrically around
	// their midpoint rather than pinning either one.
	let minY = minYRaw;
	let avgY = avgYRaw;
	const MIN_SEP = 44;
	if (minY !== null && avgY !== null && Math.abs(minY - avgY) < MIN_SEP) {
		const mid = (minY + avgY) / 2;
		minY = Math.max(labelTop, mid - MIN_SEP / 2);
		avgY = Math.min(labelBottom, mid + MIN_SEP / 2);
	}

	const tickDepths = Array.from({ length: Math.floor(axisMax / tickStep) + 1 }, (_, i) => i * tickStep);

	return (
		<div className="relative w-full h-full">
			<ThemeAwareSvg
				lightSrc="/images/depth_cov_data_card.svg"
				darkSrc="/images/depth_cov_data_card.svg"
				alt="Ocean depth profile background"
				fill
				sizes="(max-width: 1024px) 100vw, 50vw"
				priority={false}
				className="object-cover"
			/>

			<svg
				viewBox={`0 0 ${W} ${H}`}
				className="absolute inset-0 w-full h-full block font-sans"
				role="img"
				aria-label="Depth coverage profile"
			>
				{/* Surface reference — dotted line + small label. */}
				<line
					x1={0}
					y1={surfaceY}
					x2={W}
					y2={surfaceY}
					stroke="currentColor"
					className="text-base-content/25"
					strokeWidth={1}
					strokeDasharray="3 7"
				/>
				<text
					x={ticksLabelX}
					y={surfaceY - 10}
					textAnchor="end"
					className="fill-base-content/60 text-[11px] uppercase tracking-[0.18em] font-semibold"
				>
					Surface
				</text>

				{/* Depth scale ticks every 1000m on the right edge. */}
				{tickDepths.map((d) => {
					if (d === 0) return null;
					const y = depthToY(d);
					return (
						<g key={d}>
							<text
								x={ticksLabelX}
								y={y}
								dominantBaseline="middle"
								textAnchor="end"
								className="fill-base-content/45 text-[11px] font-medium tabular-nums"
							>
								{d.toLocaleString()}
							</text>
						</g>
					);
				})}

				{/* Depth labels (match dash-card typography; only the number is bold). */}
				{minY !== null && stats.min !== null && (
					<text
						x={labelX}
						y={minY}
						dominantBaseline="middle"
						className="fill-base-content/85 text-[28px] font-medium tracking-tight"
					>
						<tspan className="font-semibold tabular-nums">{formatDepth(stats.min)}</tspan>
						<tspan className="font-medium"> minimum</tspan>
					</text>
				)}

				{avgY !== null && stats.avg !== null && (
					<text
						x={labelX}
						y={avgY}
						dominantBaseline="middle"
						className="fill-base-content/85 text-[28px] font-medium tracking-tight"
					>
						<tspan className="font-semibold tabular-nums">{formatDepth(stats.avg)}</tspan>
						<tspan className="font-medium"> average min</tspan>
					</text>
				)}

				{maxY !== null && stats.max !== null && (
					<text
						x={labelX}
						y={maxY}
						dominantBaseline="middle"
						className="fill-base-content/90 text-[30px] font-medium tracking-tight"
					>
						<tspan className="font-semibold tabular-nums">{formatDepth(stats.max)}</tspan>
						<tspan className="font-medium"> maximum</tspan>
					</text>
				)}
			</svg>
		</div>
	);
}

function formatDepth(n: number) {
	return `${Math.round(n).toLocaleString()} m`;
}

export function DepthCoverageCardSkeleton() {
	return <div className="skeleton rounded-2xl h-64" aria-hidden="true" />;
}
