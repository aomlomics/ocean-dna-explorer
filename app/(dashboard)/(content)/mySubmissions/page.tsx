import SubmissionDeleteButton from "@/app/components/SubmissionDeleteButton";
import analysisDeleteAction from "@/app/helpers/actions/analysis/delete/analysisDelete";
import projectDeleteAction from "@/app/helpers/actions/analysis/delete/projectDelete";
import { prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import SubmissionEditButton from "@/app/components/SubmissionEditButton";
import analysisEditAction from "@/app/helpers/actions/analysis/edit/analysisEdit";
import projectEditAction from "@/app/helpers/actions/project/projectEdit";

export default async function MySubmissions() {
	const { userId } = await auth();
	if (!userId) {
		return <div>Unauthorized</div>;
	}

	const [projects, analyses] = await prisma.$transaction([
		prisma.project.findMany({
			where: {
				userId
			},
			omit: {
				editHistory: true,
				userId: true,
				dateSubmitted: true
			}
		}),
		prisma.analysis.findMany({
			where: {
				userId
			},
			omit: {
				editHistory: true,
				userId: true,
				dateSubmitted: true
			}
		})
	]);

	// Create a map of project_id to associated analyses, for deletion warning
	const analysesMap = analyses.reduce((acc, analysis) => {
		if (analysis.project_id) {
			if (!acc[analysis.project_id]) {
				acc[analysis.project_id] = [];
			}
			acc[analysis.project_id].push({ analysis_run_name: analysis.analysis_run_name });
		}
		return acc;
	}, {} as Record<string, { analysis_run_name: string }[]>);

	return (
		<div>
			{/* Header Section */}
			<div className="mb-10 mt-8">
				<div className="flex items-center gap-4 mb-4">
					<div className="scale-150 pointer-events-none">
						<UserButton afterSignOutUrl="/" showName={false} />
					</div>
					<h1 className="text-3xl font-medium text-primary">Submissions Manager</h1>
				</div>
				<p className="text-md text-base-content">
					View and manage your uploads. Deleting a project will also delete its associated analyses. You can delete
					individual analyses at any time.
				</p>
			</div>

			{/* Content Section */}
			<div className="grid lg:grid-cols-2 gap-8">
				{/* Projects Section */}
				<div className="card bg-base-200 shadow-sm min-h-[260px] h-fit hover:shadow-sm transition-shadow overflow-hidden">
					<div className="card-body">
						<div className="w-full h-full flex flex-col relative">
							<div>
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
									</>
								) : (
									<div className="flex flex-col gap-3 mt-2">
										{projects.map((proj) => (
											<div
												key={proj.project_id}
												className="flex items-center justify-between p-3 bg-base-100 rounded-lg"
											>
												<Link
													href={`/explore/project/${encodeURIComponent(proj.project_id)}`}
													className="text-primary hover:text-info-focus hover:underline transition-colors"
												>
													{proj.project_id}
												</Link>
												<div className="flex gap-3">
													<SubmissionEditButton
														table="project"
														titleField="project_id"
														data={proj}
														action={projectEditAction}
														noDisplay={["id"]}
													/>
													<SubmissionDeleteButton
														field="project_id"
														value={proj.project_id}
														action={projectDeleteAction}
														associatedAnalyses={analysesMap[proj.project_id] || []}
													/>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
						{projects.length === 0 && (
							<div className="absolute bottom-5 right-0 w-3/4 h-60 translate-x-1/3 translate-y-1/3">
								<Image
									src="/images/Catcher_Vessel4.svg"
									alt="Project Upload Illustration"
									fill
									className="object-contain"
								/>
							</div>
						)}
					</div>
				</div>

				{/* Analyses Section */}
				<div className="card bg-base-200 shadow-sm min-h-[260px] h-fit hover:shadow-sm transition-shadow overflow-hidden">
					<div className="card-body">
						<div className="w-full h-full flex flex-col relative">
							<div>
								<h2 className="text-2xl text-primary font-medium mb-4">Analyses:</h2>
								{analyses.length === 0 ? (
									<>
										<p className="text-base text-base-content mb-6">
											No Analyses found. Submit a new analysis to get started.
										</p>
										<div className="mt-auto">
											<Link href="/submit/analysis" className="btn btn-primary">
												Submit Analysis
											</Link>
										</div>
									</>
								) : (
									<div className="flex flex-col gap-3 mt-2">
										{analyses.map((a) => (
											<div key={a.id} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
												<Link
													href={`/explore/analysis/${encodeURIComponent(a.analysis_run_name)}`}
													className="text-primary hover:text-info-focus hover:underline transition-colors"
												>
													{a.analysis_run_name}
												</Link>
												<div className="flex gap-3">
													<SubmissionEditButton
														table="analysis"
														titleField="analysis_run_name"
														data={a}
														action={analysisEditAction}
														noDisplay={["id"]}
														noEdit={["project_id", "assay_name"]}
													/>
													<SubmissionDeleteButton
														field="analysis_run_name"
														value={a.analysis_run_name}
														action={analysisDeleteAction}
													/>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
						{analyses.length === 0 && (
							<div className="absolute bottom-6 right-6 w-1/2 h-40 translate-x-1/4 translate-y-1/4">
								<Image
									src="/images/analysis_outline_image.svg"
									alt="Analysis Upload Illustration"
									fill
									className="object-contain"
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
