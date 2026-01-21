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
import FixDeletedSamplesButton from "@/app/components/mySubmissions/FixDeletedSamplesButton";

export default async function MySubmissions() {
	const { userId } = await auth();
	if (!userId) {
		return <div>Unauthorized</div>;
	}

	const [projects, dbBadAnalyses, tags] = await prisma.$transaction([
		prisma.project.findMany({
			where: {
				userIds: {
					has: userId
				}
			},
			select: {
				project_id: true,
				userIds: true,
				isPrivate: true,
				projectMetadataFileUrl_ODE: true,
				sampleMetadataFileUrl_ODE: true,
				libraryMetadataFileUrl_ODE: true,
				Analyses: {
					select: {
						analysis_run_name: true,
						isPrivate: true,
						trusted: true,
						analysisMetadataFileUrl_ODE: true,
						asvFileUrl_ODE: true,
						occurrenceFileUrl_ODE: true,
						Tags: true
					}
				},
				_count: {
					select: {
						Samples: {
							where: {
								deleted_ODE: true
							}
						}
					}
				}
			}
		}),
		prisma.occurrence.findMany({
			where: {
				Library: {
					Sample: {
						deleted_ODE: true
					}
				}
			},
			distinct: ["analysis_run_name"],
			select: {
				analysis_run_name: true
			}
		}),
		prisma.tag.findMany()
	]);
	const badAnalyses = dbBadAnalyses.map((ba) => ba.analysis_run_name);

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Breadcrumbs */}
			<div className="text-sm breadcrumbs">
				<ul>
					<li>
						<Link href="/" className="text-primary hover:text-primary-focus">
							Home
						</Link>
					</li>
					<li>My Submissions</li>
				</ul>
			</div>

			{/* Header Section */}
			<header className="my-8 space-y-3">
				<div className="flex items-center gap-4">
					<div className="scale-150 pointer-events-none">
						<UserButton showName={false} />
					</div>
					<h1 className="text-4xl font-normal text-primary">My Submissions</h1>
				</div>
				<p className="text-base text-base-content/80">
					View and manage your project uploads. Deleting a project will also delete its associated analyses. You can
					delete individual analyses at any time.
				</p>
			</header>

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
											<div
												className={`flex items-center justify-between p-3 bg-base-100 rounded-lg ${
													proj._count.Samples ? "border-2 border-error" : ""
												}`}
											>
												<Link
													href={`/explore/project/${encodeURIComponent(proj.project_id)}`}
													className="text-primary hover:text-info-focus hover:underline transition-colors"
												>
													{proj.project_id}
												</Link>

												{proj._count.Samples ? <FixDeletedSamplesButton project_id={proj.project_id} /> : <></>}

												<div className="flex gap-3">
													<SubmissionUsersButton
														userIds={proj.userIds}
														action={projectUpdateUserIdsAction}
														target={proj.project_id}
													/>

													<ProjectEditButton
														project_id={proj.project_id}
														isPrivate={proj.isPrivate}
														projectMetadataFileUrl_ODE={proj.projectMetadataFileUrl_ODE}
														sampleMetadataFileUrl_ODE={proj.sampleMetadataFileUrl_ODE}
														libraryMetadataFileUrl_ODE={proj.libraryMetadataFileUrl_ODE}
													/>

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
																className={`flex items-center justify-between p-3 bg-base-100 rounded-lg ${
																	badAnalyses.includes(analysis.analysis_run_name) ? "border-2 border-error" : ""
																}`}
															>
																<Link
																	href={`/explore/analysis/${encodeURIComponent(analysis.analysis_run_name)}`}
																	className="text-primary hover:text-info-focus hover:underline transition-colors"
																>
																	{analysis.analysis_run_name}
																</Link>

																<div className="flex gap-3">
																	<AnalysisEditButton
																		analysis={analysis}
																		project_id={proj.project_id}
																		isPrivateDisabled={proj.isPrivate}
																		tags={tags}
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
