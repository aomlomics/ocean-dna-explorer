import Link from "next/link";
import TableMetadata from "@/types/tableMetadata";
import { prisma } from "@/app/helpers/prisma";
import GcDonut from "@/app/components/charts/GcDonut";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { decodeRouteParams } from "@/app/helpers/utils";

export default async function Analysis_run_name_Featureid({
	params
}: {
	params: Promise<{ analysis_run_name: string; featureid: string }>;
}) {
	const { analysis_run_name, featureid } = await decodeRouteParams(params);

	const assignment = await prisma.assignment.findUnique({
		where: {
			analysis_run_name_featureid: {
				analysis_run_name,
				featureid
			}
		}
	});

	if (!assignment) return <>Assignment not found</>;

	const rawConfidence = assignment.Confidence ?? 0;
	const confidencePercent = Math.max(0, Math.min(100, rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence));

	return (
		<div className="space-y-6 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/assignment" className="text-primary hover:text-primary-focus">
							Assignments
						</Link>
					</li>
					<li>Assignment</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<TitleHoverTooltip tooltip={TableMetadata.assignment.description}>
						<h1 className="text-4xl font-semibold text-primary mb-2">Assignment</h1>
					</TitleHoverTooltip>
				</div>
				<div className="mt-3 mb-4 inline-flex items-center gap-5 bg-base-200 rounded-xl px-5 py-4">
					<div className="flex flex-col">
						<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Assignment confidence</p>
						<p className="text-3xl md:text-4xl font-bold text-primary mt-1">{confidencePercent.toFixed(1)}%</p>
					</div>
					<GcDonut percentage={confidencePercent} size={72} strokeWidth={8} />
				</div>
				<p className="text-lg text-base-content/90 max-w-3xl">
					Assignment of feature{" "}
					<Link
						href={`/explore/feature/${encodeURIComponent(assignment.featureid)}`}
						className="font-semibold text-primary hover:text-primary-focus break-all"
					>
						{assignment.featureid}
					</Link>{" "}
					to taxonomy{" "}
					{assignment.taxonomy ? (
						<Link
							href={`/explore/taxonomy/${encodeURIComponent(assignment.taxonomy)}`}
							className="font-semibold text-primary hover:text-primary-focus break-all"
						>
							{assignment.taxonomy}
						</Link>
					) : (
						<span className="font-semibold text-base-content break-all">not specified</span>
					)}{" "}
					in analysis{" "}
					<Link
						href={`/explore/analysis/${encodeURIComponent(assignment.analysis_run_name)}`}
						className="font-semibold text-primary hover:text-primary-focus break-all"
					>
						{assignment.analysis_run_name}
					</Link>
					.
				</p>
				<p className="text-lg text-base-content/90 max-w-3xl mt-4">
					The key (identifier) for an assignment is the combination of analysis_run_name and featureid.
				</p>
			</header>
		</div>
	);
}
