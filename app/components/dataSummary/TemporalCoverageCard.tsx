import { prisma } from "@/app/helpers/prisma";
import DashCard from "@/app/components/dataSummary/DashCard";
import { Sample } from "@/app/generated/prisma/client";
import { exploreProjectUrl } from "@/app/helpers/utils";

/**
 * Floor for what counts as a "real" sample collection date.
 *
 * Anything earlier is treated as either a sentinel (-9999 → e.g. year-9999),
 * a Unix-epoch parse failure (1969-12-31 / 1970-01-01), or otherwise
 * unusable for "when were samples collected" math.
 */
export const EARLIEST_VALID_SAMPLE_DATE = new Date(Date.UTC(1990, 0, 1));

function getDateSpan(start: Date, end: Date): string | null {
	if (end < start) {
		return null;
	}

	// Work in UTC so daylight-saving-time transitions don't affect the math.
	const startYear = start.getUTCFullYear();
	const startMonth = start.getUTCMonth();
	const startDay = start.getUTCDate();

	const endYear = end.getUTCFullYear();
	const endMonth = end.getUTCMonth();
	const endDay = end.getUTCDate();

	let years = endYear - startYear;
	let months = endMonth - startMonth;
	let days = endDay - startDay;

	// If the day of the month hasn't been reached yet, borrow one month.
	if (days < 0) {
		months--;

		// Number of days in the month immediately preceding the end date.
		const daysInPreviousMonth = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();

		days += daysInPreviousMonth;
	}

	// If the month difference went negative, borrow one year.
	if (months < 0) {
		years--;
		months += 12;
	}

	const parts: string[] = [];

	if (years > 0) {
		parts.push(`${years} year${years === 1 ? "" : "s"}`);
	}

	if (months > 0) {
		parts.push(`${months} month${months === 1 ? "" : "s"}`);
	}

	if (days > 0 || parts.length === 0) {
		parts.push(`${days} day${days === 1 ? "" : "s"}`);
	}

	return parts.join(", ");
}

export async function TemporalCoverageCard({ project_id }: { project_id?: Sample["project_id"] }) {
	const agg = await prisma.sample.aggregate({
		where: {
			project_id,
			eventDate: {
				gte: EARLIEST_VALID_SAMPLE_DATE
			}
		},
		_min: {
			eventDate: true
		},
		_max: {
			eventDate: true
		},
		_count: {
			eventDate: true
		}
	});

	const min = agg._min.eventDate;
	const max = agg._max.eventDate;

	const fmt = (d: Date | null) =>
		d
			? new Date(d).toLocaleDateString(undefined, {
					month: "short",
					day: "numeric",
					year: "numeric"
				})
			: "—";

	const spanLabel = min && max ? getDateSpan(min, max) : null;

	return (
		<DashCard
			title="Temporal Coverage"
			titleClassName="text-base-content/75"
			info={{
				title: "Temporal Coverage",
				description:
					"The earliest and latest real eventDate across samples. Samples whose eventDate encodes a 'not applicable' sentinel (e.g. -9999) or an epoch-parse ghost (≈1969-1970) are excluded.",
				links: [
					{
						label: project_id ? "Browse this project's samples" : "Browse samples",
						href: project_id ? exploreProjectUrl(project_id) : "/explore/sample"
					}
				]
			}}
		>
			<div className="flex items-baseline gap-2 mb-4">
				<span className="text-3xl font-normal text-base-content tabular-nums leading-none">{spanLabel ?? "—"}</span>
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
					<div className="text-[10px] uppercase tracking-wider font-semibold text-base-content/70">Earliest</div>

					<div className="text-base-content tabular-nums font-semibold text-base sm:text-lg leading-tight">
						{fmt(min)}
					</div>
				</div>

				<div className="text-right">
					<div className="text-[10px] uppercase tracking-wider font-semibold text-base-content/70">Latest</div>

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
