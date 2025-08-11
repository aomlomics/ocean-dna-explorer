import SubmissionDeleteButton from "@/app/components/mySubmissions/SubmissionDeleteButton";
import analysisDeleteAction from "@/app/actions/analysis/analysisDelete";
import projectDeleteAction from "@/app/actions/project/projectDelete";
import { prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import analysisEditAction from "@/app/actions/analysis/analysisEdit";
import projectEditAction from "@/app/actions/project/projectEdit";
import SubmissionEditButton from "@/app/components/mySubmissions/SubmissionEditButton";
import SubmissionUsersButton from "@/app/components/mySubmissions/SubmissionUsersButton";
import projectUpdateUserIdsAction from "@/app/actions/project/projectUpdateUserIds";
import SamplesEditButton from "@/app/components/mySubmissions/SamplesEditButton";

const BoatIcon = () => (
	<svg viewBox="0 0 424 169" className="w-full h-full text-primary">
		<path
			fill="currentColor"
			d="M177.09,96.19c.85-1.5,18.16-54.31,18.16-54.31,0,0,6.1-3.1,18.75.15,10.81,2.79,15.96,6.24,15.96,6.24l-4.8,56.13 M419.8,119.51c-9.19-16.33-18.31-33.36-26.1-48.55-3.79-7.5-9.88-13.32-14.73-12.97-4.36.3-7.5,1.5-6.88,8.88,1.39,18,4.96,36.3,7.18,54.46.79,9.21,13.18,17.35,26.31,14.76,12.88-2.56,19-9.18,14.22-16.57h0ZM404.97,133.68c-9,2.17-18.1-5.08-19.09-13.15-2.39-16-4.89-31.95-7.5-47.85-1.27-8.13.66-8.88,3.99-9.37,3.33-.49,5.49,4.77,8.65,11.34,7.21,15,15.61,31.62,22.5,45,3.61,6.54.28,11.91-8.55,14.04h0z M419.95 111.83 405.39 111.83 404.99 106.55 383.6 106.55 383.6 125.67 397.62 125.67 406.46 125.67 423.37 120.09 419.95 111.83 419.95 111.83 419.95 111.83 M173.43,2.11c-2.61,11.17-5.53,22.27-8.47,33.39l-4.5,16.62-2.29,8.29c-.84,2.76-1.14,5.62-3.51,8.02l-1.75-.42c-.79-3.13.48-5.79,1.2-8.56l2.34-8.26,4.86-16.5c3.36-11.01,6.7-22,10.38-33l1.75.42Z M330.5,119.7s-1.42-18.54-22.81-18.54c-19.69,0-33.31,2.41-37.5-2.4-6.94-7.87-19.36-6.09-19.36-6.09h-74.21v-28.29h-28.36l-11.43-7.5-37.75,7.8,5.79,8.73v19.26H1.5l27.82,27h0l50.17,48.3h325.48s5.79-6.69,11.13-20.77c3.29-8.79,5.75-17.88,7.33-27.13l-92.93-.36ZM116.02,74.02c0,2.02-1.64,3.66-3.66,3.66s-3.66-1.64-3.66-3.66v-4.66c0-2.02,1.64-3.66,3.66-3.66s3.66,1.64,3.66,3.66v4.66ZM125.68,74.02c0,2.02-1.64,3.66-3.66,3.66s-3.66-1.64-3.66-3.66v-4.66c0-2.02,1.64-3.66,3.66-3.66s3.66,1.64,3.66,3.66v4.66ZM135.34,74.02c-.13,2.03-1.88,3.56-3.9,3.43-1.84-.12-3.31-1.59-3.43-3.43v-4.66c.13-2.03,1.88-3.56,3.9-3.43,1.84.12,3.31,1.59,3.43,3.43v4.66Z M136.09,46.99l25.5,2.58s-1.23-.62-1.23-3.07,1.23-2.46,1.23-2.46l-25.5-2.58c-.79.79-1.23,1.88-1.21,3-.04.99.41,1.94,1.21,2.53h0Z M183.72,47.2l-25.24,3.24s1.21-.78,1.21-3.87-1.21-3.07-1.21-3.07l25.24-3.25c.81,1.07,1.23,2.37,1.21,3.7.1,1.21-.35,2.4-1.21,3.25h0Z M148.67,26.17l19.32,2.52s-.93-.6-.93-3,.93-2.35.93-2.35l-19.32-2.46c-.61.81-.94,1.8-.91,2.82-.08.92.26,1.83.91,2.47h0Z M185.01,26.56l-19.27,2.47s.93-.58.93-3-.93-2.37-.93-2.37l19.27-2.47c.62.81.95,1.81.93,2.83.1.94-.25,1.88-.93,2.53h0Z M162.42,7.33l9.24,1.86s-.43-.44-.43-2.13.43-1.68.43-1.68l-9.24-1.78c-.32.63-.47,1.32-.45,2.02-.04.6.12,1.2.45,1.71h0Z M178.86,7.37l-7.99,1.81s.37-.42.37-2.11-.37-1.69-.37-1.69l7.99-1.77c.28.64.41,1.33.39,2.02.04.61-.09,1.21-.39,1.74h0Z M276.54,35.11l-1.18-1.38c.56-1.48.85-3.05.85-4.63.05-7.21-5.75-13.09-12.96-13.14-7.21-.05-13.09,5.75-13.14,12.96-.01,1.65.29,3.28.88,4.81l-1.2,1.38,10.23,11.86v54h6.3v-54l10.21-11.86h0Z"
		/>
	</svg>
);

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
		omit: {
			editHistory: true,
			dateSubmitted: true
		},
		include: {
			Analyses: true
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
			<div
				className={`card bg-base-200 shadow-sm min-h-[260px] h-fit hover:shadow-sm transition-shadow overflow-hidden relative ${
					projects.length === 0 ? "max-w-2xl mx-auto" : ""
				}`}
			>
				<div className="card-body">
					<div className="w-full h-full flex flex-col">
						<h2 className="text-2xl text-primary font-medium mb-4">Projects:</h2>
						{projects.length === 0 ? (
							<div className="card bg-base-200 shadow-sm min-h-[260px] relative overflow-hidden">
								<div className="card-body">
									<div className="w-full h-full flex flex-col" style={{ zIndex: 1 }}>
										<div>
											<h2 className="text-2xl text-primary mb-4">No Projects Found</h2>
											<p className="text-base text-base-content/80 mb-6">
												Submit a new project to get started.
											</p>
										</div>
										<div className="mt-auto">
											<Link href="/submit/project" className="btn btn-primary">
												Start New Project
											</Link>
										</div>
									</div>
									<div className="absolute -bottom-5 right-5 w-2/5 h-4/5 text-primary pointer-events-none">
										<BoatIcon />
									</div>
								</div>
							</div>
						) : (
							<div className="flex flex-col gap-3 mt-2">
								{projects.map((proj) => (
									<div key={proj.id} className="flex flex-col gap-3">
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

												<SubmissionEditButton
													table="project"
													titleField="project_id"
													data={proj}
													action={projectEditAction}
													privateToggleDescription="This will also update all associated Samples, Assays, and Libraries. If this setting is changing to private, all Analyses for this Project along with their associated Occurrences, Assignments, Features, and Taxonomies will be updated as well."
													omit={["userIds", "Analyses"]}
												/>
												<SamplesEditButton />
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
															key={analysis.id}
															className="flex items-center justify-between p-3 bg-base-100 rounded-lg"
														>
															<Link
																href={`/explore/analysis/${encodeURIComponent(analysis.analysis_run_name)}`}
																className="text-primary hover:text-info-focus hover:underline transition-colors"
															>
																{analysis.analysis_run_name}
															</Link>
															<div className="flex gap-3">
																<SubmissionEditButton
																	table="analysis"
																	titleField="analysis_run_name"
																	data={analysis}
																	action={analysisEditAction}
																	disabled={["project_id", "assay_name"]}
																	privateToggleDescription="This will also update all associated Occurrences, Assignments, Features, and Taxonomies."
																	omit={["editHistory", "dateSubmitted"]}
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
					</div>
				</div>
			</div>
		</div>
	);
}

