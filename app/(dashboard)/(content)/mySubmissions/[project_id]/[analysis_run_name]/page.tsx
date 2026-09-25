import analysisDeleteAction from "@/app/actions/analysis/delete/analysisDelete";
import InfoButton from "@/app/components/InfoButton";
import AnalysisEditForm from "@/app/components/mySubmissions/analysis/AnalysisEditForm";
import SubmissionDeleteButton from "@/app/components/mySubmissions/SubmissionDeleteButton";
import { prisma } from "@/app/helpers/prisma";
import { exploreUrl } from "@/app/helpers/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
	params
}: {
	params: Promise<{ project_id: string; analysis_run_name: string }>;
}): Promise<Metadata> {
	const { project_id, analysis_run_name } = await params;

	const analysis = await prisma.analysis.findUnique({
		where: {
			project_id_analysis_run_name: {
				project_id,
				analysis_run_name
			}
		},
		select: {
			id: true
		}
	});

	if (analysis) {
		return {
			title: analysis_run_name
		};
	} else {
		return {
			title: "Analysis not found"
		};
	}
}

export default async function MySubmissionsAnalysis({
	params
}: {
	params: Promise<{ project_id: string; analysis_run_name: string }>;
}) {
	const { project_id, analysis_run_name } = await params;

	const [analysis, tags] = await prisma.$transaction([
		prisma.analysis.findUnique({
			where: {
				project_id_analysis_run_name: {
					project_id,
					analysis_run_name
				}
			},
			select: {
				project_id: true,
				analysis_run_name: true,
				trusted: true,
				analysisMetadataFileUrl_ODE: true,
				asvFileUrl_ODE: true,
				occurrenceFileUrl_ODE: true,
				Tags: true,
				_count: {
					select: {
						Libraries: {
							where: {
								Sample: {
									deleted_ODE: true
								}
							}
						}
					}
				}
			}
		}),
		prisma.tag.findMany()
	]);

	if (!analysis) {
		notFound();
	}

	return (
		<div>
			<header className="w-full pb-10">
				<div className="flex items-center justify-between pb-2">
					<div className="flex gap-5 items-center">
						<Link
							className="link link-primary link-hover text-4xl break-all"
							href={exploreUrl({ table: "analysis", project_id, analysis_run_name })}
						>
							{analysis_run_name}
						</Link>

						{analysis.trusted ? (
							<div className="badge badge-primary badge-sm text-neutral-content">Trusted</div>
						) : (
							<></>
						)}
					</div>

					<SubmissionDeleteButton
						action={analysisDeleteAction}
						table="Analysis"
						target={[project_id, analysis_run_name]}
					/>
				</div>

				<p className="text-lg text-base-content/70">
					Part of the{" "}
					<Link href={exploreUrl({ table: "project", project_id })} className="link link-primary link-hover">
						{project_id}
					</Link>{" "}
					project
				</p>
			</header>

			<div>
				<h2
					className={`flex gap-1 text-2xl border-b mb-3 ${analysis._count.Libraries ? "text-error border-error" : "text-primary border-primary"}`}
				>
					Edit Files
					{analysis._count.Libraries ? (
						<InfoButton
							type="error"
							text="Some Samples in this Analysis have been deleted in the parent Project. Edit this Analysis's files to remove those deleted Samples. Then, go to the parent Project in My Submissions and click the Fix button in the Deleted Samples section."
						/>
					) : (
						<></>
					)}
				</h2>

				<AnalysisEditForm analysis={analysis} tags={tags} />
			</div>
		</div>
	);
}
