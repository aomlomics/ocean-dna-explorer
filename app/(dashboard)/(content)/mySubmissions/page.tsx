import SubmissionDeleteButton from "@/app/components/mySubmissions/SubmissionDeleteButton";
import analysisDeleteAction from "@/app/actions/analysis/delete/analysisDelete";
import projectDeleteAction from "@/app/actions/project/delete/projectDelete";
import { prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import SubmissionUsersButton from "@/app/components/mySubmissions/SubmissionUsersButton";
import projectUpdateUserIdsAction from "@/app/actions/project/update/projectUpdateUserIds";
import AnalysisEditButton from "@/app/components/mySubmissions/AnalysisEditButton";
import ProjectEditButton from "@/app/components/mySubmissions/ProjectEditButton";

export default async function MySubmissions() {
	const { userId } = await auth();
	if (!userId) {
		return <div>Unauthorized</div>;
	}

	const projects = await prisma.project.findMany({
		where: {
			userIds: {
				has: userId
			}
		},
		select: {
			project_id: true,
			userIds: true,
			isPrivate: true,
			Analyses: {
				select: {
					analysis_run_name: true,
					isPrivate: true
				}
			}
		}
	});

	return (
		<div>
			{/* Header Section */}
			<div className="mb-10 mt-8">
				<div className="flex items-center gap-4 mb-4">
					<div className="scale-150 pointer-events-none">
						<UserButton showName={false} />
					</div>
					<h1 className="text-3xl font-medium text-primary">Submissions Manager</h1>
				</div>
				<p className="text-md text-base-content">
					View and manage your uploads. Deleting a project will also delete its associated analyses. You can delete
					individual analyses at any time.
				</p>
			</div>

			{/* Content Section */}
			{/* Projects Section */}
			<div className="card bg-base-200 shadow-sm min-h-[260px] h-fit hover:shadow-sm transition-shadow overflow-hidden">
				<div className="card-body">
					<div className="w-full h-full flex flex-col relative">
						<>
							<h2 className="text-2xl text-primary font-medium mb-4">Projects:</h2>
							{projects.length === 0 ? (
								<>
									<p className="text-base text-base-content mb-6">
										No Projects found. Submit a new project to get started.
									</p>
									<div className="mt-auto">
										<Link href="/submit/project" className="btn btn-primary">
											Submit Project
										</Link>
									</div>
									<div className="absolute bottom-5 right-0 w-3/4 h-60 translate-x-1/3 translate-y-1/3">
										<Image
											src="/images/Catcher_Vessel4.svg"
											alt="Project Upload Illustration"
											fill
											className="object-contain"
										/>
									</div>
								</>
							) : (
								<div className="flex flex-col gap-3 mt-2">
									{projects.map((proj) => (
										<div key={proj.project_id} className="flex flex-col gap-3">
											<div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
												<Link
													href={`/explore/project/${encodeURIComponent(proj.project_id)}`}
													className="text-primary hover:text-info-focus hover:underline transition-colors"
												>
													{proj.project_id}
												</Link>

												<div className="flex gap-3">
													<SubmissionUsersButton
														userIds={proj.userIds}
														action={projectUpdateUserIdsAction}
														target={proj.project_id}
													/>

													<ProjectEditButton project_id={proj.project_id} isPrivate={proj.isPrivate} />

													<SubmissionDeleteButton
														field="project_id"
														value={proj.project_id}
														action={projectDeleteAction}
														associatedAnalyses={proj.Analyses}
													/>
												</div>
											</div>

											<div className="flex flex-col gap-3 ml-20">
												{!!proj.Analyses.length && (
													<>
														<h2 className="text-lg text-primary font-medium">Analyses:</h2>
														{proj.Analyses.map((analysis) => (
															<div
																key={analysis.analysis_run_name}
																className="flex items-center justify-between p-3 bg-base-100 rounded-lg"
															>
																<Link
																	href={`/explore/analysis/${encodeURIComponent(analysis.analysis_run_name)}`}
																	className="text-primary hover:text-info-focus hover:underline transition-colors"
																>
																	{analysis.analysis_run_name}
																</Link>

																<div className="flex gap-3">
																	<AnalysisEditButton
																		analysis_run_name={analysis.analysis_run_name}
																		isPrivate={analysis.isPrivate}
																		isPrivateDisabled={proj.isPrivate}
																	/>
																	<SubmissionDeleteButton
																		field="analysis_run_name"
																		value={analysis.analysis_run_name}
																		action={analysisDeleteAction}
																	/>
																</div>
															</div>
														))}
													</>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</>
					</div>
				</div>
			</div>
		</div>
	);
}
