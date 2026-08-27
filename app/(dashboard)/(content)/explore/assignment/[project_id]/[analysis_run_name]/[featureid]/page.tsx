import Link from "next/link";
import TableMetadata, { exploreUrl } from "@/types/tableMetadata";
import { trustedPrisma } from "@/app/helpers/prisma";
import GcDonut from "@/app/components/charts/GcDonut";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { decodeRouteParams } from "@/app/helpers/utils";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { RanksBySpecificity } from "@/types/objects";

export async function generateMetadata({
	params
}: {
	params: Promise<{ project_id: string; analysis_run_name: string; featureid: string }>;
}): Promise<Metadata> {
	const { project_id, analysis_run_name, featureid } = await decodeRouteParams(params);

	const assignment = await trustedPrisma.assignment.findUnique({
		where: {
			project_id_analysis_run_name_featureid: {
				project_id,
				analysis_run_name,
				featureid
			}
		},
		select: {
			Taxonomy: true
		}
	});

	if (assignment) {
		return {
			title: `${featureid} assigned ${assignment.Taxonomy[RanksBySpecificity.find((rank) => assignment.Taxonomy[rank]) || "taxonomy"]} | ${TableMetadata.assignment.plural}`
		};
	} else {
		return {
			title: "Assignment not found"
		};
	}
}

export default async function AssignmentPage({
	params
}: {
	params: Promise<{ project_id: string; analysis_run_name: string; featureid: string }>;
}) {
	const { project_id, analysis_run_name, featureid } = await decodeRouteParams(params);

	const assignment = await trustedPrisma.assignment.findUnique({
		where: {
			project_id_analysis_run_name_featureid: {
				project_id,
				analysis_run_name,
				featureid
			}
		}
	});

	if (!assignment) notFound();

	const rawConfidence = assignment.Confidence ?? 0;
	const confidencePercent = Math.max(0, Math.min(100, rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence));

	return (
		<div className="space-y-6 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/project" className="text-primary hover:text-primary-focus">
							Projects
						</Link>
					</li>
					<li>
						<Link href={exploreUrl({ table: "project", project_id })} className="text-primary hover:text-primary-focus">
							{project_id}
						</Link>
					</li>
					<li>
						<Link href="/explore/analysis" className="text-primary hover:text-primary-focus">
							Analyses
						</Link>
					</li>
					<li>
						<Link
							href={exploreUrl({ table: "analysis", project_id, analysis_run_name })}
							className="text-primary hover:text-primary-focus"
						>
							{analysis_run_name}
						</Link>
					</li>
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
						href={exploreUrl({ table: "feature", featureid })}
						className="font-semibold text-primary hover:text-primary-focus break-all"
					>
						{assignment.featureid}
					</Link>{" "}
					to taxonomy{" "}
					<Link
						href={exploreUrl({ table: "taxonomy", taxonomy: assignment.taxonomy })}
						className="font-semibold text-primary hover:text-primary-focus break-all"
					>
						{assignment.taxonomy}
					</Link>{" "}
					in analysis{" "}
					<Link
						href={exploreUrl({ table: "analysis", project_id, analysis_run_name })}
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
