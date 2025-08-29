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
					View and manage your project uploads. Deleting a project will also delete its associated analyses. You can delete
					individual analyses at any time.
				</p>
			</header>

			{/* Content Section */}
			{projects.length === 0 ? (
				<div className="card bg-base-200 shadow-sm min-h-[260px] relative overflow-hidden max-w-2xl mx-auto">
					<div className="card-body">
						<div className="w-full h-full flex flex-col" style={{ zIndex: 1 }}>
							<div>
								<h2 className="text-2xl text-primary mb-4 font-normal">No Projects Found</h2>
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
				<div className="space-y-6">
					<div className="flex items-center gap-3 mb-8">
						<span className="badge badge-primary bg-base-100 text-base-content font-medium">{projects.length}</span>
						<h2 className="text-2xl font-normal text-primary">Projects</h2>
					</div>
					
					{projects.map((proj) => (
						<div key={proj.id} className="card bg-base-100 shadow-md hover:shadow-lg hover:bg-base-200/50 transition-all duration-200 border border-base-300 group">
							<div className="card-body p-6">
								{/* Project Header */}
								<div className="flex items-center justify-between border-b border-primary/20 pb-5 mb-5">
									<Link
										href={`/explore/project/${encodeURIComponent(proj.project_id)}`}
										className="text-primary hover:text-primary-focus hover:underline transition-colors flex items-center gap-3"
									>
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-primary">
											<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
										</svg>
										<span className="text-xl font-normal">{proj.project_id}</span>
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

								{/* Analyses Section */}
								{!!proj.Analyses.length && (
									<div className="space-y-3">
										<div className="flex items-center gap-2 text-base-content/70 mb-3">
											<span className="text-sm font-normal text-base-content/80">Analyses ({proj.Analyses.length})</span>
										</div>
										<div className="pl-6 space-y-2">
											{proj.Analyses.map((analysis) => (
												<div
													key={analysis.id}
													className="flex items-center justify-between p-4 bg-base-100 rounded-lg border border-base-300 hover:bg-base-300/50 group-hover:bg-base-300/30 transition-colors duration-150"
												>
													<div className="flex items-center gap-3">
														<div className="flex items-center text-base-content/40">
															<span className="text-sm"></span>
														</div>
														<Link
															href={`/explore/analysis/${encodeURIComponent(analysis.analysis_run_name)}`}
															className="text-primary hover:text-primary-focus hover:underline transition-colors font-medium"
														>
															{analysis.analysis_run_name}
														</Link>
													</div>
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
										</div>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

