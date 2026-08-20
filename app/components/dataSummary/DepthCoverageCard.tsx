import { trustedPrisma } from "@/app/helpers/prisma";
import DashCard from "@/app/components/dataSummary/DashCard";
import { Sample } from "@/app/generated/prisma/client";
import { exploreUrl } from "@/types/tableMetadata";

type DepthStats = {
	min: number | null;
	avg: number | null;
	max: number | null;
};

export async function DepthCoverageCard({ project_id }: { project_id?: Sample["project_id"] }) {
	// -9999 is the project sentinel for "not applicable". Filtering depths
	// to >= 0 strips both that sentinel and any other negative noise.
	const [minAgg, maxAgg, avgMinAgg, avgMaxAgg] = await trustedPrisma.$transaction([
		trustedPrisma.sample.aggregate({
			where: { project_id, minimumDepthInMeters: { gte: 0 } },
			_min: { minimumDepthInMeters: true }
		}),
		trustedPrisma.sample.aggregate({
			where: { project_id, maximumDepthInMeters: { gte: 0 } },
			_max: { maximumDepthInMeters: true }
		}),
		trustedPrisma.sample.aggregate({
			where: { project_id, minimumDepthInMeters: { gte: 0 } },
			_avg: { minimumDepthInMeters: true }
		}),
		trustedPrisma.sample.aggregate({
			where: { project_id, maximumDepthInMeters: { gte: 0 } },
			_avg: { maximumDepthInMeters: true }
		})
	]);

	const stats: DepthStats = {
		min: minAgg._min.minimumDepthInMeters,
		avg:
			avgMinAgg._avg.minimumDepthInMeters !== null && avgMaxAgg._avg.maximumDepthInMeters !== null
				? (avgMinAgg._avg.minimumDepthInMeters + avgMaxAgg._avg.maximumDepthInMeters) / 2
				: (avgMinAgg._avg.minimumDepthInMeters ?? avgMaxAgg._avg.maximumDepthInMeters),
		max: maxAgg._max.maximumDepthInMeters
	};

	return (
		<div className="w-full">
			<DashCard
				title="Sampling Depth"
				titleClassName="text-base sm:text-lg font-semibold text-base-content/80"
				className="h-64 w-full"
				bodyClassName="p-0"
				headerClassName="relative z-10 bg-base-200 pb-3"
				padding="none"
				info={{
					title: "Sampling Depth",
					description:
						"Displays minimumDepthInMeters and maximumDepthInMeters in meters. Average depth is computed as the mean of average minimumDepthInMeters and average maximumDepthInMeters.",
					links: [
						{
							label: project_id ? "Browse this project's samples" : "Browse samples",
							href: project_id ? exploreUrl({ table: "project", project_id }) : "/explore/sample"
						}
					]
				}}
			>
				<DepthStatsPanel stats={stats} />
			</DashCard>
		</div>
	);
}

function DepthStatsPanel({ stats }: { stats: DepthStats }) {
	const allMissing = stats.min === null && stats.avg === null && stats.max === null;
	if (allMissing) {
		return (
			<div className="h-full flex items-center justify-center text-sm text-base-content/60 italic">
				No valid depth data yet.
			</div>
		);
	}

	return (
		<div className="h-full px-5 sm:px-6 pb-4 sm:pb-5 flex flex-col justify-center">
			<dl className="w-full grid grid-cols-2 gap-x-6 gap-y-5 items-start">
				<DepthMetric label="minimumDepthInMeters" value={stats.min} emphasized />
				<DepthMetric label="Average Depth" value={stats.avg} size="medium" />
				<DepthMetric label="maximumDepthInMeters" value={stats.max} emphasized />
				<div aria-hidden="true" />
			</dl>
		</div>
	);
}

function DepthMetric({
	label,
	value,
	emphasized = false,
	align = "left",
	size = "default"
}: {
	label: string;
	value: number | null;
	emphasized?: boolean;
	align?: "left" | "right" | "center";
	size?: "default" | "medium";
}) {
	const valueClass = emphasized
		? "text-4xl sm:text-[2.4rem] text-primary font-bold tracking-tight"
		: size === "medium"
			? "text-[2.1rem] sm:text-[2.2rem] text-base-content/85 font-semibold tracking-tight"
			: "text-2xl sm:text-[1.65rem] text-base-content/75 font-semibold tracking-tight";
	const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

	return (
		<div className={alignClass}>
			<dd className={["tabular-nums leading-none", valueClass].join(" ")}>
				{value === null ? (
					"—"
				) : (
					<>
						{formatDepthValue(value)}
						<span className="ml-1 text-[0.58em] font-bold">m</span>
					</>
				)}
			</dd>
			<dt className="text-xs sm:text-sm font-semibold text-base-content/60 mt-2 leading-tight">{label}</dt>
		</div>
	);
}

function formatDepthValue(n: number) {
	return Math.round(n).toLocaleString();
}

export function DepthCoverageCardSkeleton() {
	return <div className="skeleton rounded-2xl h-64 w-full" aria-hidden="true" />;
}
