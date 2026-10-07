import projectDeleteAction from "@/app/actions/project/delete/projectDelete";
import InfoButton from "@/app/components/InfoButton";
import FixDeletedSamplesButton from "@/app/components/mySubmissions/project/FixDeletedSamplesButton";
import ProjectEditForm from "@/app/components/mySubmissions/project/ProjectEditForm";
import SpotlightManager from "@/app/components/mySubmissions/project/SpotlightManager";
import SpotlightSubmitForm from "@/app/components/mySubmissions/project/SpotlightSubmitForm";
import SubmissionDeleteButton from "@/app/components/mySubmissions/SubmissionDeleteButton";
import UserAdder from "@/app/components/UserAdder";
import type { TaxonomySpotlightModel } from "@/app/generated/prisma/models";
import { prisma } from "@/app/helpers/prisma";
import { prismaImages } from "@/app/helpers/prismaImages";
import { exploreUrl } from "@/app/helpers/utils";
import type { ImageWithRelations } from "@/prismaImages/generated/zod";
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

	const [project, taxonomies, otherSpotlights, existingSpotlights] = await prisma.$transaction([
		prisma.project.findUnique({
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
		}),
		prisma.taxonomy.findMany({
			where: {
				Analyses: {
					some: {
						project_id
					}
				},
				TaxonomySpotlights: {
					every: {
						project_id: {
							not: project_id
						}
					}
				}
			},
			select: {
				taxonomy: true
			}
		}),
		prisma.taxonomySpotlight.findMany({
			where: {
				project_id: {
					not: project_id
				},
				Taxonomy: {
					Analyses: {
						some: {
							project_id
						}
					}
				}
			}
		}),
		prisma.taxonomySpotlight.findMany({
			where: {
				project_id
			}
		})
	]);

	if (!project) {
		notFound();
	}

	//get images and attributions for spotlights
	const [otherImages, existingImages] = await prismaImages.$transaction([
		prismaImages.image.findMany({
			where: {
				url: {
					in: otherSpotlights.map((sl) => sl.imageFileUrl_ODE)
				}
			},
			include: {
				Attribution: true
			}
		}),
		prismaImages.image.findMany({
			where: {
				url: {
					in: existingSpotlights.map((sl) => sl.imageFileUrl_ODE)
				}
			},
			include: {
				Attribution: true
			}
		})
	]);

	//spotlights that exist in other projects for taxonomies within this project
	const otherSpotlightsWithImages = otherSpotlights.map((sl) => ({
		...sl,
		Image: otherImages.find((i) => sl.imageFileUrl_ODE === i.url)
	})) as (TaxonomySpotlightModel & { Image: ImageWithRelations })[];
	//spotlights that already exist for this project
	const existingSpotlightsWithImages = existingSpotlights.map((sl) => ({
		...sl,
		Image: existingImages.find((i) => sl.imageFileUrl_ODE === i.url)
	})) as (TaxonomySpotlightModel & { Image: ImageWithRelations })[];

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

			<div>
				<h2 className="text-primary text-2xl border-b border-primary mb-3">Manage Taxonomy Spotlights</h2>

				<div role="tablist" className="tabs bg-transparent gap-2 flex-wrap p-0">
					<input
						type="radio"
						defaultChecked
						name="spotlightTabs"
						role="tab"
						className="tab btn text-primary-content"
						aria-label="New"
					/>
					<div role="tabpanel" className="tab-content w-full mt-2">
						<SpotlightSubmitForm
							project_id={project_id}
							taxonomies={taxonomies.map((t) => t.taxonomy).sort()}
							spotlightsWithImage={otherSpotlightsWithImages}
						/>
					</div>

					<input
						type="radio"
						name="spotlightTabs"
						role="tab"
						className="tab btn text-primary-content"
						aria-label="Existing"
						disabled={!existingSpotlightsWithImages.length}
					/>
					<div role="tabpanel" className="tab-content w-full mt-2">
						<SpotlightManager spotlightsWithImage={existingSpotlightsWithImages} />
					</div>
				</div>
			</div>
		</div>
	);
}
