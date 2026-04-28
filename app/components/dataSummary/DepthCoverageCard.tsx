import { publicPrisma } from "@/app/helpers/prisma";
import DashCard from "@/app/components/dataSummary/DashCard";

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
			className="h-full"
			bodyClassName="relative p-0"
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

	// Internal viewBox dimensions — the SVG itself scales to its parent
	// width via w-full and keeps this aspect ratio.
	const W = 720;
	const H = 420;

	// Vertical band the depth labels can occupy. Top reserves room for the
	// "Surface" reference; bottom keeps labels off the abyss floor.
	const labelTop = 98;
	const labelBottom = H - 70;
	// Labels live to the right of the steep shelf so they never collide
	// with the silhouette.
	const labelX = 332;

	// Scale each depth proportionally to the deepest known value. The
	// 1.05 ceiling adds a small water cushion so the deepest label never
	// sits on top of the seamount.
	const ref = Math.max(1, stats.max ?? stats.avg ?? stats.min ?? 1);
	const ceiling = ref * 1.05;
	const depthToY = (d: number) => {
		const t = Math.max(0, Math.min(1, d / ceiling));
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

	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			className="w-full h-72 sm:h-80 block font-[inherit]"
			role="img"
			aria-label="Depth coverage profile"
		>
			<defs>
				<linearGradient id="depth-water" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
					<stop offset="100%" stopColor="currentColor" stopOpacity="0.9" />
				</linearGradient>
				<filter id="depth-label-shadow">
					<feDropShadow dx="0" dy="1.5" stdDeviation="1.75" floodColor="#000000" floodOpacity="0.6" />
				</filter>
			</defs>

			{/* Ocean water background fills the whole card body. */}
			<rect x={0} y={0} width={W} height={H} fill="url(#depth-water)" className="text-base-300" />

			{/* Surface line / label for orientation, matching sketch language. */}
			<line x1={0} y1={78} x2={126} y2={78} stroke="currentColor" className="text-base-content/20" strokeWidth={1} />
			<text
				x={20}
				y={68}
				className="fill-base-content/55 text-[12px] uppercase tracking-[0.18em] font-semibold"
			>
				Surface
			</text>

			{/* Ocean floor silhouette: shelf -> dropoff -> abyssal plain -> small seamount. */}
			<path
				d={`
					M 0,130
					L 46,138
					L 78,146
					L 106,164
					L 124,186
					L 140,220
					L 150,254
					L 160,294
					L 170,336
					L 192,374
					L 232,404
					L 570,404
					L 598,398
					L 616,384
					L 630,372
					L 646,388
					L 666,408
					L 690,410
					L 720,404
					L 720,${H}
					L 0,${H}
					Z
				`}
				fill="currentColor"
				className="text-base-content/25"
			/>

			{/* Depth labels are intentionally large and central to this card. */}
			{minY !== null && stats.min !== null && (
				<text
					x={labelX}
					y={minY}
					dominantBaseline="middle"
					filter="url(#depth-label-shadow)"
					className="fill-base-content text-[34px] font-extrabold tabular-nums tracking-tight"
				>
					{`− ${formatDepth(stats.min)} minimum`}
				</text>
			)}

			{avgY !== null && stats.avg !== null && (
				<text
					x={labelX}
					y={avgY}
					dominantBaseline="middle"
					filter="url(#depth-label-shadow)"
					className="fill-base-content text-[34px] font-extrabold tabular-nums tracking-tight"
				>
					{`− ${formatDepth(stats.avg)} average min`}
				</text>
			)}

			{maxY !== null && stats.max !== null && (
				<text
					x={labelX}
					y={maxY}
					dominantBaseline="middle"
					filter="url(#depth-label-shadow)"
					className="fill-base-content text-[36px] font-extrabold tabular-nums tracking-tight"
				>
					{`− ${formatDepth(stats.max)} maximum`}
				</text>
			)}
		</svg>
	);
}

function formatDepth(n: number) {
	return `${Math.round(n).toLocaleString()} m`;
}

export function DepthCoverageCardSkeleton() {
	return <div className="skeleton rounded-2xl h-72" aria-hidden="true" />;
}
