import projectDeleteAction from "@/app/actions/project/delete/projectDelete";
import InfoButton from "@/app/components/InfoButton";
import FixDeletedSamplesButton from "@/app/components/mySubmissions/FixDeletedSamplesButton";
import ProjectEditForm from "@/app/components/mySubmissions/ProjectEditForm";
import SubmissionDeleteButton from "@/app/components/mySubmissions/SubmissionDeleteButton";
import UserAdder from "@/app/components/UserAdder";
import { prisma } from "@/app/helpers/prisma";
import { exploreUrl } from "@/app/helpers/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ project_id: string }> }): Promise<Metadata> {
	const { project_id } = await params;

	const project = await prisma.project.findUnique({
		where: {
			project_id
		},
		select: {
			id: true
		}
	});

	if (project) {
		return {
			title: project_id
		};
	} else {
		return {
			title: "Project not found"
		};
	}
}

export default async function MySubmissionsProject({ params }: { params: Promise<{ project_id: string }> }) {
	const { project_id } = await params;

	const project = await prisma.project.findUnique({
		where: {
			project_id
		},
		select: {
			project_id: true,
			project_name: true,
			userIds: true,
			imageFileUrl_ODE: true,
			projectMetadataFileUrl_ODE: true,
			sampleMetadataFileUrl_ODE: true,
			libraryMetadataFileUrl_ODE: true,
			Analyses: {
				select: {
					analysis_run_name: true
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
	});

	if (!project) {
		notFound();
	}

	return (
		<div className="flex flex-col gap-10">
			<header className="w-full">
				<div className="flex items-center justify-between pb-2">
					<Link
						className="link link-primary link-hover text-4xl break-all"
						href={exploreUrl({ table: "project", project_id })}
					>
						{project_id}
					</Link>

					<SubmissionDeleteButton
						action={projectDeleteAction}
						table="Project"
						target={project_id}
						associatedTable="Analysis"
						associated={project.Analyses}
					/>
				</div>

				<p className="text-lg text-base-content/70">{project.project_name}</p>
			</header>

			{project._count.Samples ? (
				<div>
					<h2 className="flex gap-3 border-b border-error mb-3">
						<div className="text-error text-2xl">Deleted Samples:</div>

						<InfoButton
							type="error"
							text="Some Samples were deleted in the sampleMetadata file, but still existed in some Analyses. Once those Analyses have been updated to no longer use the deleted Samples, click the button below to remove those deleted Samples from this Project."
						/>
					</h2>

					<FixDeletedSamplesButton project_id={project_id} />
				</div>
			) : (
				<></>
			)}

			<div>
				<h2 className="text-primary text-2xl border-b border-primary mb-3">Edit Files</h2>

				<ProjectEditForm {...project} />
			</div>

			<div>
				<h2 className="text-primary text-2xl border-b border-primary mb-3">Add/Remove Users</h2>

				<UserAdder submittable userIds={project.userIds} project_id={project_id} />
			</div>
		</div>
	);
}
