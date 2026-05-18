import { publicPrisma } from "@/app/helpers/prisma";
import DashCard from "@/app/components/dataSummary/DashCard";

/**
 * Floor for what counts as a "real" sample collection date. Anything
 * earlier is treated as either a sentinel (-9999 → e.g. year-9999),
 * a Unix-epoch parse failure (1969-12-31 / 1970-01-01), or otherwise
 * unusable for "when were samples collected" math.
 *
 * Bumped from 1900-01-01 to 1990-01-01 because the previous floor was
 * letting epoch-adjacent ghost dates leak through and pull the chart's
 * left edge way back.
 */
export const EARLIEST_VALID_SAMPLE_DATE = new Date(Date.UTC(1990, 0, 1));

type TemporalCoverageCardProps = {
	/**
	 * Optional project scope. When supplied, the card shows the temporal
	 * window for that project's samples only.
	 */
	projectId?: string;
};

export async function TemporalCoverageCard({ projectId }: TemporalCoverageCardProps) {
	// Only consider samples whose eventDate is *actually* a usable date —
	// filter out sentinel values (e.g. -9999) encoded as absurdly-early
	// dates in the DB. publicPrisma handles the isPrivate=false filter.
	const agg = await publicPrisma.sample.aggregate({
		where: {
			eventDate: { gte: EARLIEST_VALID_SAMPLE_DATE },
			...(projectId ? { project_id: projectId } : {})
		},
		_min: { eventDate: true },
		_max: { eventDate: true },
		_count: { eventDate: true }
	});
	const min = agg._min.eventDate;
	const max = agg._max.eventDate;
	const totalWithDate = agg._count.eventDate;

	const fmt = (d: Date | null) =>
		d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

	let yearsSpan: number | null = null;
	let spanLabel: string | null = null;
	if (min && max) {
		const msPerDay = 1000 * 60 * 60 * 24;
		const msPerYear = msPerDay * 365.25;
		yearsSpan = Math.max(0, (max.getTime() - min.getTime()) / msPerYear);

		// Friendly, glanceable span label. We approximate months as 30 days
		// to avoid expensive calendar math while keeping the unit breakdown
		// intuitive.
		const totalDays = Math.max(0, Math.round((max.getTime() - min.getTime()) / msPerDay));
		const years = Math.floor(totalDays / 365);
		const daysAfterYears = totalDays % 365;
		const months = Math.floor(daysAfterYears / 30);
		const days = daysAfterYears % 30;

		const parts: string[] = [];
		if (years > 0) parts.push(`${years} year${years === 1 ? "" : "s"}`);
		if (months > 0) parts.push(`${months} month${months === 1 ? "" : "s"}`);
		if (days > 0 || parts.length === 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
		spanLabel = parts.join(", ");
	}

	return (
		<DashCard
			title="Temporal Coverage"
			titleClassName="text-base-content/75"
			info={{
				title: "Temporal Coverage",
				description:
					"The earliest and latest real eventDate across public samples. Samples whose eventDate encodes a 'not applicable' sentinel (e.g. -9999) or an epoch-parse ghost (≈1969–1970) are excluded.",
				links: [
					{
						label: projectId ? "Browse this project's samples" : "Browse samples",
						href: projectId ? `/explore/project/${projectId}` : "/explore/sample"
					}
				]
			}}
		>
			<div className="flex items-baseline gap-2 mb-4">
				<span className="text-3xl font-normal text-base-content tabular-nums leading-none">
					{spanLabel ?? "—"}
				</span>
			</div>

			<div className="relative mb-3">
				<div className="h-1.5 rounded-full bg-base-300/70 overflow-hidden">
					<div className="h-full w-full rounded-full bg-linear-to-r from-primary/50 via-primary to-accent" />
				</div>
				<span className="absolute -top-1 left-0 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-base-200" />
				<span className="absolute -top-1 right-0 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-base-200" />
			</div>
			<div className="flex items-center justify-between text-xs">
				<div>
					<div className="text-[10px] uppercase tracking-wider font-semibold text-base-content/55">
						Earliest
					</div>
					<div className="text-base-content tabular-nums font-semibold text-base sm:text-lg leading-tight">
						{fmt(min)}
					</div>
				</div>
				<div className="text-right">
					<div className="text-[10px] uppercase tracking-wider font-semibold text-base-content/55">
						Latest
					</div>
					<div className="text-base-content tabular-nums font-semibold text-base sm:text-lg leading-tight">
						{fmt(max)}
					</div>
				</div>
			</div>
		</DashCard>
	);
}

export function TemporalCoverageCardSkeleton() {
	return <div className="skeleton rounded-2xl h-56" aria-hidden="true" />;
}
